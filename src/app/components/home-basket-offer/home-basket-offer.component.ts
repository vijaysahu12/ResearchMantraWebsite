import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BasketSummary } from '../../models/research.models';
import { ProductBasketService } from '../../services/product-basket.service';
import { ResearchAuthService } from '../../services/research-auth.service';

/** CRM basket names sometimes come through as a stray placeholder (".", "null", empty) rather than unset. */
const PLACEHOLDER_NAMES = new Set(['', '.', '-', 'null', 'n/a', 'na', 'undefined']);
const FALLBACK_BASKET_NAME = 'Exclusive Basket Offer';

/**
 * Home-page highlight for the Dynamic Product Basket — a "Special Offer"
 * banner featuring the basket's own image, sourced entirely from
 * GetActiveProductBaskets (CRM-managed). Renders nothing when there is no
 * active basket (Section 16: "No Active Basket").
 */
@Component({
  selector: 'app-home-basket-offer',
  imports: [],
  templateUrl: './home-basket-offer.component.html',
  styleUrl: './home-basket-offer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeBasketOfferComponent implements OnInit {
  private readonly basketService = inject(ProductBasketService);
  private readonly auth = inject(ResearchAuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly baskets = signal<BasketSummary[]>([]);
  readonly loading = signal(true);
  /** A single active basket gets a bigger, hero-style presentation instead of a card row. */
  readonly isSingle = computed(() => this.baskets().length === 1);

  ngOnInit(): void {
    // Load only in the browser (avoids a failed call during prerender/SSR).
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    } else {
      this.loading.set(false);
    }
  }

  load(): void {
    this.loading.set(true);
    this.basketService
      .getActiveBaskets()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (baskets) => this.baskets.set(baskets),
        // Silent on failure — this is a promotional highlight, not core
        // navigation; the rest of the home page must not be blocked by it.
        error: () => this.baskets.set([]),
      });
  }

  /** Login is only required at "Buy" — logged out, remember this basket and send them to login first. */
  openBasket(basket: BasketSummary): void {
    const url = `/research/basket/${basket.id}`;
    if (!this.auth.isAuthenticated()) {
      this.auth.setPostLoginRedirect(url);
      void this.router.navigate(['/login']);
      return;
    }
    void this.router.navigateByUrl(url);
  }

  monogram(name: string): string {
    return (this.displayName(name) || '?').trim().slice(0, 1).toUpperCase();
  }

  /** CRM data can be an empty/placeholder string — fall back to something presentable rather than showing it raw. */
  displayName(name: string | null | undefined): string {
    const trimmed = (name ?? '').trim();
    return trimmed && !PLACEHOLDER_NAMES.has(trimmed.toLowerCase()) ? trimmed : FALLBACK_BASKET_NAME;
  }
}
