import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductDetail } from '../../models/research.models';
import { ProductService } from '../../services/product.service';
import { ResearchAuthService } from '../../services/research-auth.service';
import { PurchaseDialogComponent } from '../purchase-dialog/purchase-dialog.component';

@Component({
  selector: 'app-research-product-detail',
  imports: [RouterLink, DecimalPipe, PurchaseDialogComponent],
  templateUrl: './research-product-detail.component.html',
  styleUrl: './research-product-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchProductDetailComponent implements OnInit {
  private readonly products = inject(ProductService);
  private readonly auth = inject(ResearchAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly product = signal<ProductDetail | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly session = this.auth.session;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly showPurchase = signal(false);

  private productId = '';

  readonly isOwned = computed(() => {
    const product = this.product();
    return Boolean(product?.isInMyBucket && product?.isInValidity);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('This product could not be found.');
      this.loading.set(false);
      return;
    }
    this.productId = id;
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.products
      .getProductById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (product) => this.product.set(product),
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : '';
          this.errorMessage.set(message || 'We could not load this product right now.');
        },
      });
  }

  retry(): void {
    if (this.productId) this.load(this.productId);
  }

  openPurchase(): void {
    // Login is only required at the buy step. If logged out, remember this
    // product page and send them to login; they return here after signing in.
    if (!this.isAuthenticated()) {
      this.auth.setPostLoginRedirect(this.router.url);
      void this.router.navigate(['/login']);
      return;
    }
    this.showPurchase.set(true);
  }

  onPurchased(): void {
    const product = this.product();
    if (product) this.product.set({ ...product, isInMyBucket: true, isInValidity: true });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  monogram(name: string): string {
    return (name || '?').trim().slice(0, 1).toUpperCase();
  }
}
