import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductDetail, ProductPerformanceItem } from '../../models/research.models';
import { ProductService } from '../../services/product.service';
import { ResearchAuthService } from '../../services/research-auth.service';
import { ResearchCartService } from '../../services/research-cart.service';
import { PurchaseDialogComponent } from '../purchase-dialog/purchase-dialog.component';

const PERFORMANCE_PAGE_SIZE = 10;
const CHART_BASELINE = 25;
const CHART_HALF_HEIGHT = 22;
const CHART_BAR_GAP = 1.2;

type DetailTab = 'about' | 'performance';

interface PerformanceChartBar {
  x: number;
  y: number;
  width: number;
  height: number;
  isPositive: boolean;
  trade: ProductPerformanceItem;
}

interface PerformanceSummary {
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  avgRoi: number;
}

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
  private readonly cartService = inject(ResearchCartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly product = signal<ProductDetail | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly session = this.auth.session;
  readonly isAuthenticated = this.auth.isAuthenticated;
  readonly showPurchase = signal(false);
  readonly addingToCart = signal(false);
  readonly addToCartError = signal('');

  readonly activeTab = signal<DetailTab>('about');
  readonly performance = signal<ProductPerformanceItem[]>([]);
  readonly performanceLoading = signal(false);
  readonly performanceLoadingMore = signal(false);
  readonly performanceError = signal('');
  readonly performanceHasMore = signal(true);
  readonly hoveredTradeIndex = signal<number | null>(null);
  private performancePage = 1;
  private performanceLoaded = false;

  private productId = '';

  readonly isOwned = computed(() => {
    const product = this.product();
    return Boolean(product?.isInMyBucket && product?.isInValidity);
  });

  /** Oldest-first so the chart reads left-to-right like a timeline. */
  readonly chartTrades = computed(() => [...this.performance()].reverse());

  readonly chartBars = computed<PerformanceChartBar[]>(() => {
    const rows = this.chartTrades();
    const n = rows.length;
    if (!n) return [];

    const maxAbs = Math.max(1, ...rows.map((row) => Math.abs(row.profit)));
    const barWidth = (100 - CHART_BAR_GAP * (n + 1)) / n;

    return rows.map((trade, i) => {
      const magnitude = Math.abs(trade.profit) / maxAbs;
      const height = trade.profit === 0 ? 0.6 : Math.max(magnitude * CHART_HALF_HEIGHT, 1.4);
      const isPositive = trade.profit >= 0;
      return {
        x: CHART_BAR_GAP + i * (barWidth + CHART_BAR_GAP),
        y: isPositive ? CHART_BASELINE - height : CHART_BASELINE,
        width: barWidth,
        height,
        isPositive,
        trade,
      };
    });
  });

  readonly performanceSummary = computed<PerformanceSummary | null>(() => {
    const rows = this.performance();
    const total = rows.length;
    if (!total) return null;

    const wins = rows.filter((row) => row.profit > 0).length;
    const totalProfit = rows.reduce((sum, row) => sum + row.profit, 0);
    const avgRoi = rows.reduce((sum, row) => sum + row.roi, 0) / total;

    return { totalTrades: total, winRate: (wins / total) * 100, totalProfit, avgRoi };
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

  selectTab(tab: DetailTab): void {
    this.activeTab.set(tab);
    if (tab === 'performance' && !this.performanceLoaded) this.loadPerformance();
  }

  private loadPerformance(): void {
    this.performanceLoaded = true;
    this.performancePage = 1;
    this.performanceLoading.set(true);
    this.performanceError.set('');
    this.products
      .getProductPerformance(this.productId, PERFORMANCE_PAGE_SIZE, this.performancePage)
      .pipe(finalize(() => this.performanceLoading.set(false)))
      .subscribe({
        next: (rows) => {
          this.performance.set(rows);
          this.performanceHasMore.set(rows.length >= PERFORMANCE_PAGE_SIZE);
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : '';
          this.performanceError.set(message || 'We could not load the performance history right now.');
        },
      });
  }

  retryPerformance(): void {
    this.performanceLoaded = false;
    this.loadPerformance();
  }

  loadMorePerformance(): void {
    const nextPage = this.performancePage + 1;
    this.performanceLoadingMore.set(true);
    this.products
      .getProductPerformance(this.productId, PERFORMANCE_PAGE_SIZE, nextPage)
      .pipe(finalize(() => this.performanceLoadingMore.set(false)))
      .subscribe({
        next: (rows) => {
          this.performancePage = nextPage;
          this.performance.update((existing) => [...existing, ...rows]);
          this.performanceHasMore.set(rows.length >= PERFORMANCE_PAGE_SIZE);
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : '';
          this.performanceError.set(message || 'We could not load more trades right now.');
        },
      });
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

  /** Only ever called when logged in — the "Add to cart" button is hidden entirely otherwise. */
  addToCart(): void {
    const product = this.product();
    if (!product || !this.isAuthenticated() || this.addingToCart()) return;

    this.addingToCart.set(true);
    this.addToCartError.set('');
    this.cartService
      .addToCart(product.id)
      .pipe(finalize(() => this.addingToCart.set(false)))
      .subscribe({
        next: (response) => {
          // 200 = newly added, 409 = already there — both mean the product is in the cart now.
          if (response.statusCode === 200 || response.statusCode === 409) {
            this.product.set({ ...product, isInCart: true });
          } else {
            this.addToCartError.set(response.message || 'This product could not be added to your cart.');
          }
        },
        error: (error: unknown) => {
          this.addToCartError.set(error instanceof Error ? error.message : 'This product could not be added to your cart.');
        },
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  monogram(name: string): string {
    return (name || '?').trim().slice(0, 1).toUpperCase();
  }

  hoverBar(index: number | null): void {
    this.hoveredTradeIndex.set(index);
  }

  /** Splits the API's "date time" string into a date part and a muted time part. */
  splitDate(entryDateTime: string | undefined): { date: string; time: string } {
    if (!entryDateTime) return { date: '—', time: '' };
    const [date, time = ''] = entryDateTime.split(' ');
    return { date, time };
  }
}
