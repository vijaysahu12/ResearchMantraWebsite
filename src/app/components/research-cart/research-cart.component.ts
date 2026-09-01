import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription, catchError, finalize, of, switchMap, timer } from 'rxjs';
import { AppliedCouponInput, CartItem, CartWithDurations, PaymentStatusProduct } from '../../models/research.models';
import { ResearchAuthService } from '../../services/research-auth.service';
import { ResearchCartService } from '../../services/research-cart.service';
import { describePaymentError, ResearchSubscriptionService } from '../../services/research-subscription.service';

type PayStatus = 'idle' | 'pending' | 'success' | 'failed';

@Component({
  selector: 'app-research-cart',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './research-cart.component.html',
  styleUrl: './research-cart.component.css',
  host: { '(window:focus)': 'onWindowFocus()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchCartComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly cartService = inject(ResearchCartService);
  private readonly subscriptions = inject(ResearchSubscriptionService);
  private readonly auth = inject(ResearchAuthService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal('');
  readonly cart = signal<CartWithDurations | null>(null);
  readonly selectedDurationId = signal<number | null>(null);
  readonly expandedId = signal<number | null>(null);

  /**
   * One coupon per product. The pricing endpoint takes the whole set
   * (`appliedCoupons`) and returns each item's own `appliedCouponCode` /
   * `couponDiscountAmount`, so applying a code to one product must never clear
   * another product's code.
   */
  readonly appliedCoupons = signal<AppliedCouponInput[]>([]);
  readonly couponBusyId = signal<number | null>(null);
  readonly couponErrors = signal<Record<number, string>>({});
  readonly removingId = signal<number | null>(null);

  readonly paying = signal(false);
  readonly purchaseError = signal('');
  readonly payStatus = signal<PayStatus>('idle');
  readonly paymentRequestId = signal('');
  readonly statusChecking = signal(false);

  readonly fullName = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] });
  readonly email = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });

  readonly items = computed(() => this.cart()?.items ?? []);
  readonly durations = computed(() => this.cart()?.durations ?? []);
  readonly selectedDuration = computed(
    () => this.durations().find((d) => d.subscriptionDurationId === this.selectedDurationId()) ?? null,
  );
  readonly finalAmount = computed(() => this.selectedDuration()?.finalAmount ?? 0);
  readonly originalTotal = computed(() => this.selectedDuration()?.totalAmount ?? 0);

  // Three independent discounts stack to produce the final price — shown separately so it's
  // clear where each rupee saved comes from, instead of one blended percentage:
  //  1) Plan discount   — baked into this duration's pricing (e.g. quarterly/yearly plans), fixed regardless of cart size.
  //  2) Bundle discount — the product-count tier (or 50% once every eligible product is in the cart); this is the one that changes as items are added/removed.
  //  3) Coupon discount — from a manually-applied coupon code, if any.
  readonly planDiscount = computed(() => this.selectedDuration()?.planDiscountAmount ?? 0);
  readonly bundleDiscount = computed(() => this.selectedDuration()?.discountAmount ?? 0);
  readonly bundleDiscountPercent = computed(() => this.selectedDuration()?.discountPercent ?? 0);
  readonly couponDiscount = computed(() => this.selectedDuration()?.couponDiscountAmount ?? 0);

  // "saving" is the backend's reconciled total: original total − final amount, i.e. the sum of
  // all three discounts above. Original Price − Total Savings always equals Total.
  readonly totalDiscount = computed(() => this.selectedDuration()?.saving ?? 0);
  readonly totalSavingsPercent = computed(() => {
    const original = this.originalTotal();
    return original > 0 ? Math.round((this.totalDiscount() / original) * 100) : 0;
  });
  readonly isEmpty = computed(() => !this.loading() && this.items().length === 0);

  /** Drives the checkout stepper — mirrors the real payment state, not a separate UI-only flag. */
  readonly currentStep = computed<'cart' | 'payment' | 'confirmation'>(() => {
    const status = this.payStatus();
    if (status === 'success') return 'confirmation';
    if (status === 'pending' || status === 'failed') return 'payment';
    return 'cart';
  });

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

  private readonly couponControls = new Map<number, FormControl<string>>();
  private pollSub?: Subscription;
  private pollCount = 0;

  ngOnInit(): void {
    const name = this.auth.session()?.name;
    if (name) this.fullName.setValue(name);

    // The login/OTP APIs don't return an email address — fetch it from the user's profile.
    this.auth.getUserBasicDetails().subscribe((details) => {
      if (details?.emailId) this.email.setValue(details.emailId);
      if (details?.fullName) this.fullName.setValue(details.fullName);
    });

    this.bootstrap();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  bootstrap(): void {
    this.loading.set(true);
    this.error.set('');

    this.cartService
      .getCartWithDurations([])
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (cart) => {
          this.cart.set(cart);
          this.selectedDurationId.set(cart.currentDurationId);
        },
        error: (err: unknown) => this.error.set(err instanceof Error ? err.message : 'Your cart could not be loaded.'),
      });
  }

  toggleExpand(item: CartItem): void {
    this.expandedId.update((current) => (current === item.id ? null : item.id));
  }

  couponControl(productMId: number): FormControl<string> {
    let control = this.couponControls.get(productMId);
    if (!control) {
      control = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(50)] });
      this.couponControls.set(productMId, control);
    }
    return control;
  }

  couponErrorFor(productMId: number): string {
    return this.couponErrors()[productMId] ?? '';
  }

  applyCoupon(item: CartItem): void {
    const duration = this.selectedDuration();
    const code = this.couponControl(item.productMId).value.trim();
    if (!duration || !code || this.couponBusyId() != null) return;

    this.couponBusyId.set(item.productMId);
    this.setCouponError(item.productMId, '');
    this.subscriptions
      .validateCoupon(item.productMId, duration.subscriptionDurationId, code)
      .pipe(finalize(() => this.couponBusyId.set(null)))
      .subscribe({
        next: () => {
          // Replace only this product's coupon; every other product keeps its own.
          this.appliedCoupons.update((coupons) => [
            ...coupons.filter((c) => c.productId !== item.productMId),
            { productId: item.productMId, couponCode: code.toUpperCase() },
          ]);
          this.reload();
        },
        error: () => this.setCouponError(item.productMId, 'That coupon is invalid or not available for this duration.'),
      });
  }

  removeCoupon(item: CartItem): void {
    if (!this.appliedCoupons().some((c) => c.productId === item.productMId)) return;
    this.appliedCoupons.update((coupons) => coupons.filter((c) => c.productId !== item.productMId));
    this.couponControl(item.productMId).reset();
    this.reload();
  }

  selectDuration(durationId: number): void {
    if (durationId === this.selectedDurationId() || this.refreshing()) return;
    this.refreshing.set(true);
    this.cartService
      .updateDuration(durationId)
      .pipe(
        switchMap(() => this.cartService.getCartWithDurations(this.currentAppliedCoupons())),
        finalize(() => this.refreshing.set(false)),
      )
      .subscribe({
        next: (cart) => {
          this.cart.set(cart);
          this.selectedDurationId.set(cart.currentDurationId);
        },
        error: () => this.error.set('The duration could not be updated. Please try again.'),
      });
  }

  removeItem(item: CartItem): void {
    this.removingId.set(item.id);
    this.cartService
      .removeFromCart(item.id)
      .pipe(
        switchMap(() => {
          // Drop only the removed product's coupon.
          this.appliedCoupons.update((coupons) => coupons.filter((c) => c.productId !== item.productMId));
          this.couponControls.get(item.productMId)?.reset();
          return this.cartService.getCartWithDurations(this.currentAppliedCoupons());
        }),
        finalize(() => this.removingId.set(null)),
      )
      .subscribe({
        next: (cart) => this.cart.set(cart),
        error: () => this.error.set('The item could not be removed. Please try again.'),
      });
  }

  proceedToPay(): void {
    const duration = this.selectedDuration();
    const items = this.items();
    if (!duration || items.length === 0 || this.paying()) return;

    this.fullName.markAsTouched();
    this.email.markAsTouched();
    if (this.fullName.invalid || this.email.invalid) {
      this.purchaseError.set('Please add your name and email address to continue.');
      return;
    }

    const isFree = this.finalAmount() === 0;
    const paymentWindow = isFree ? null : window.open('', '_blank');
    this.paying.set(true);
    this.purchaseError.set('');

    const merchantTransactionId = this.subscriptions.newMerchantTransactionId();

    this.subscriptions
      .addPaymentRequest({
        productIds: items.map((i) => i.productMId),
        amount: this.finalAmount(),
        // `amount` already has every applied coupon priced in by the cart
        // endpoint, so the charge is correct. AddPaymentRequest only carries a
        // single `couponCode`, so it records the first applied code; see
        // paymentCouponCode().
        couponCode: this.paymentCouponCode(),
        subscriptionDurationId: duration.subscriptionDurationId,
        merchantTransactionId,
        customerName: this.fullName.value.trim(),
        customerEmail: this.email.value.trim(),
      })
      .pipe(finalize(() => this.paying.set(false)))
      .subscribe({
        next: (result) => {
          if (isFree) {
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

  /**
   * The code sent to Payment/AddPaymentRequest, which accepts one `couponCode`
   * string only. The charged `amount` already reflects every applied coupon, so
   * this affects the redemption record rather than the price. If the backend
   * gains multi-coupon support, this is the single place to change.
   */
  private paymentCouponCode(): string {
    return this.appliedCoupons()[0]?.couponCode ?? '';
  }

  private currentAppliedCoupons(): AppliedCouponInput[] {
    return this.appliedCoupons();
  }

  private reload(): void {
    this.refreshing.set(true);
    this.cartService
      .getCartWithDurations(this.currentAppliedCoupons())
      .pipe(finalize(() => this.refreshing.set(false)))
      .subscribe({
        next: (cart) => this.cart.set(cart),
        error: () => this.error.set('Your cart could not be refreshed. Please try again.'),
      });
  }

  private setCouponError(productMId: number, message: string): void {
    this.couponErrors.update((current) => ({ ...current, [productMId]: message }));
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
      this.onPaymentSuccess();
      return true;
    }
    if (statuses.some((s) => s === 'FAILED')) {
      this.onPaymentFailed();
      return true;
    }
    return false;
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  private onPaymentSuccess(): void {
    this.stopPolling();
    this.payStatus.set('success');
  }

  private onPaymentFailed(): void {
    this.stopPolling();
    this.payStatus.set('failed');
  }

  goToMyBucket(): void {
    void this.router.navigateByUrl('/research/purchases');
  }
}
