import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, catchError, finalize, of, switchMap, timer } from 'rxjs';
import { BasketOverview, PaymentStatusProduct } from '../../models/research.models';
import { ProductBasketService } from '../../services/product-basket.service';
import { describePaymentError, ResearchSubscriptionService } from '../../services/research-subscription.service';

type PayStatus = 'idle' | 'pending' | 'success' | 'failed';

/** CRM basket names sometimes come through as a stray placeholder (".", "null", empty) rather than unset. */
const PLACEHOLDER_NAMES = new Set(['', '.', '-', 'null', 'n/a', 'na', 'undefined']);
const FALLBACK_BASKET_NAME = 'Exclusive Basket Offer';

@Component({
  selector: 'app-research-basket-overview',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './research-basket-overview.component.html',
  styleUrl: './research-basket-overview.component.css',
  host: { '(window:focus)': 'onWindowFocus()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchBasketOverviewComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly basketService = inject(ProductBasketService);
  private readonly subscriptions = inject(ResearchSubscriptionService);
  private readonly titleService = inject(Title);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly basket = signal<BasketOverview | null>(null);

  readonly paying = signal(false);
  readonly purchaseError = signal('');
  readonly payStatus = signal<PayStatus>('idle');
  readonly paymentRequestId = signal('');
  readonly statusChecking = signal(false);

  readonly discountLabel = computed(() => {
    const b = this.basket();
    if (!b) return '';
    return b.discountType?.toUpperCase() === 'FLAT'
      ? `₹${(b.discountFlatAmount ?? 0).toLocaleString('en-IN')} OFF`
      : `${b.discountPercent ?? 0}% OFF`;
  });

  readonly savingsPercent = computed(() => {
    const b = this.basket();
    if (!b || b.totalOriginalValue <= 0) return 0;
    return Math.round((b.totalSavings / b.totalOriginalValue) * 100);
  });

  /** Ambient, gently-bobbing party-popper decoration behind the hero heading — purely festive, aria-hidden. */
  readonly heroConfetti = ['🎉', '✨', '🎊', '✨', '🎉', '🎊', '✨', '🎉'].map((icon, i) => ({
    icon,
    left: (i * 12.7 + (i % 3) * 6) % 100,
    top: (i % 2 === 0 ? 14 : 62) + (i % 4) * 6,
    size: 18 + (i % 3) * 6,
    duration: 3200 + (i % 4) * 500,
    delay: (i % 5) * 320,
  }));

  /**
   * "Stock offer celebration" — a stock-market-and-party mix scattered in the
   * light margins beside the content cards (charts for "stock", firecrackers
   * and confetti for "offer celebration"), purely decorative/aria-hidden.
   * Sized to actually read as decoration in that wide-screen empty margin,
   * not disappear as tiny specks. Positioned in px (not %) so it sits in the
   * visible hero→content band rather than smeared across the page's full
   * scroll height.
   */
  readonly pageCelebration = [
    { icon: '🧨', side: 'right', top: 40, size: 110 },
    { icon: '📈', side: 'left', top: 110, size: 60 },
    { icon: '📊', side: 'right', top: 310, size: 46 },
    { icon: '🎊', side: 'left', top: 400, size: 52 },
    { icon: '💹', side: 'right', top: 480, size: 50 },
    { icon: '✨', side: 'left', top: 640, size: 34 },
  ].map((c, i) => ({ ...c, duration: 3600 + (i % 3) * 500, delay: (i % 4) * 350 }));

  readonly confettiPieces = Array.from({ length: 44 }, (_, i) => {
    const colors = ['#FACC15', '#f8b018', '#ff9500', '#22c55e', '#3b82f6', '#ef4444', '#ffffff', '#a855f7'];
    return {
      left: (i * 23 + (i % 5) * 9) % 100,
      color: colors[i % colors.length],
      duration: 1400 + (i % 8) * 170,
      delay: (i % 12) * 45,
      xEnd: (((i * 61) % 220) - 110) + 'px',
      rot: ((i * 53) % 6 * 90 + 180) + 'deg',
    };
  });

  private basketId = '';
  private pollSub?: Subscription;
  private pollCount = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('This basket could not be found.');
      this.loading.set(false);
      return;
    }
    this.basketId = id;
    this.load();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.basketService
      .getBasketOverview(this.basketId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (basket) => {
          this.basket.set(basket);
          this.titleService.setTitle(`${this.displayName(basket.name)} | Research Mantra`);
        },
        error: (error: unknown) => {
          this.errorMessage.set(describePaymentError(error, 'This basket could not be loaded.'));
        },
      });
  }

  buyBasket(): void {
    const basket = this.basket();
    if (!basket || !basket.isCurrentlyPurchasable || this.paying()) return;

    const isFree = basket.finalAmount === 0;
    // Open the tab synchronously (within the click) so pop-up blockers allow it.
    const paymentWindow = isFree ? null : window.open('', '_blank');
    this.paying.set(true);
    this.purchaseError.set('');

    const merchantTransactionId = this.subscriptions.newMerchantTransactionId();

    this.basketService
      .initiateBasketPurchase(basket.id, merchantTransactionId)
      .pipe(finalize(() => this.paying.set(false)))
      .subscribe({
        next: (result) => {
          if (isFree || result?.isFree) {
            this.payStatus.set('success');
            return;
          }
          if (!result?.url) {
            paymentWindow?.close();
            this.purchaseError.set('The payment link could not be created. Please try again.');
            return;
          }
          if (paymentWindow) {
            paymentWindow.location.href = result.url;
            paymentWindow.focus();
          } else {
            window.open(result.url, '_blank');
          }
          this.paymentRequestId.set(merchantTransactionId);
          this.startPolling();
        },
        error: (error: unknown) => {
          paymentWindow?.close();
          this.purchaseError.set(describePaymentError(error, 'The payment link could not be created.'));
        },
      });
  }

  checkStatusNow(): void {
    if (!this.paymentRequestId() || this.statusChecking()) return;
    this.statusChecking.set(true);
    this.subscriptions
      .getPaymentStatusV2(this.paymentRequestId())
      .pipe(finalize(() => this.statusChecking.set(false)))
      .subscribe({
        next: (products) => this.handleStatus(products),
        error: () => undefined,
      });
  }

  cancelPending(): void {
    this.stopPolling();
    this.payStatus.set('idle');
  }

  retryFailed(): void {
    this.payStatus.set('idle');
    this.purchaseError.set('');
  }

  onWindowFocus(): void {
    if (this.payStatus() === 'pending') this.checkStatusNow();
  }

  goToMyBucket(): void {
    void this.router.navigateByUrl('/research/purchases');
  }

  monogram(name: string): string {
    return (this.displayName(name) || '?').trim().slice(0, 1).toUpperCase();
  }

  /** CRM data can be an empty/placeholder string — fall back to something presentable rather than showing it raw. */
  displayName(name: string | null | undefined): string {
    const trimmed = (name ?? '').trim();
    return trimmed && !PLACEHOLDER_NAMES.has(trimmed.toLowerCase()) ? trimmed : FALLBACK_BASKET_NAME;
  }

  private startPolling(): void {
    this.stopPolling();
    this.payStatus.set('pending');
    this.pollCount = 0;
    this.pollSub = timer(3000, 4000)
      .pipe(
        switchMap(() =>
          this.subscriptions.getPaymentStatusV2(this.paymentRequestId()).pipe(catchError(() => of([] as PaymentStatusProduct[]))),
        ),
      )
      .subscribe((products) => {
        this.pollCount += 1;
        if (!this.handleStatus(products) && this.pollCount >= 75) this.stopPolling();
      });
  }

  /** Returns true once a terminal status (success/failed) was reached. */
  private handleStatus(products: PaymentStatusProduct[]): boolean {
    if (products.length === 0) return false;
    const statuses = products.map((p) => p.paymentStatus?.toUpperCase());
    if (statuses.every((s) => s === 'SUCCESS')) {
      this.stopPolling();
      this.payStatus.set('success');
      return true;
    }
    if (statuses.some((s) => s === 'FAILED')) {
      this.stopPolling();
      this.payStatus.set('failed');
      return true;
    }
    return false;
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }
}
