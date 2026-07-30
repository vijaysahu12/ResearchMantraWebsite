import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, catchError, finalize, of, switchMap, timer } from 'rxjs';
import { PaymentStatusProduct, SubscriptionDuration } from '../../models/research.models';
import { ResearchSubscriptionService } from '../../services/research-subscription.service';

type PayStatus = 'idle' | 'pending' | 'success' | 'failed';

@Component({
  selector: 'app-purchase-dialog',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './purchase-dialog.component.html',
  styleUrl: './purchase-dialog.component.css',
  host: { '(window:focus)': 'onWindowFocus()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseDialogComponent implements OnInit, OnDestroy {
  private readonly subscriptions = inject(ResearchSubscriptionService);

  readonly productId = input.required<number>();
  readonly productName = input('');
  readonly productImage = input<string | null>(null);
  readonly category = input('');
  readonly productTag = input('');

  readonly closed = output<void>();
  readonly purchased = output<void>();

  readonly plansLoading = signal(false);
  readonly plansError = signal('');
  readonly durations = signal<SubscriptionDuration[]>([]);
  readonly selectedDuration = signal<SubscriptionDuration | null>(null);
  readonly applyingCoupon = signal(false);
  readonly couponDiscount = signal(0);
  readonly appliedCoupon = signal('');
  readonly paying = signal(false);
  readonly purchaseError = signal('');

  readonly payStatus = signal<PayStatus>('idle');
  readonly paymentRequestId = signal('');
  readonly statusChecking = signal(false);

  readonly coupon = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(50)] });

  private pollSub?: Subscription;
  private pollCount = 0;

  readonly finalAmount = computed(() => {
    const duration = this.selectedDuration();
    if (!duration) return 0;
    const base = duration.netPayment ?? duration.discountPrice ?? duration.actualPrice ?? 0;
    return Math.max(0, +(base - this.couponDiscount()).toFixed(2));
  });

  readonly selectedOriginal = computed(() => {
    const duration = this.selectedDuration();
    if (!duration) return 0;
    return duration.actualPrice && duration.actualPrice > 0 ? duration.actualPrice : (duration.netPayment ?? 0);
  });

  readonly planDiscount = computed(() => {
    const duration = this.selectedDuration();
    if (!duration) return 0;
    const original = duration.actualPrice ?? 0;
    const base = duration.netPayment ?? original;
    return Math.max(0, +(original - base).toFixed(2));
  });

  readonly totalSavings = computed(() =>
    Math.max(0, +(this.selectedOriginal() - this.finalAmount()).toFixed(2)),
  );

  readonly savingsPercent = computed(() => {
    const original = this.selectedOriginal();
    return original > 0 ? Math.round((this.totalSavings() / original) * 100) : 0;
  });

  readonly perMonthAmount = computed(() => {
    const duration = this.selectedDuration();
    if (!duration || !duration.months || duration.months <= 0) return 0;
    return Math.max(0, Math.round(this.finalAmount() / duration.months));
  });

  ngOnInit(): void {
    this.loadPlans();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  close(): void {
    if (this.paying()) return;
    this.closed.emit();
  }

  onOverlayClick(): void {
    if (this.payStatus() === 'idle' && !this.paying()) this.closed.emit();
  }

  loadPlans(): void {
    this.plansLoading.set(true);
    this.plansError.set('');
    this.subscriptions
      .getProductSubscriptions(this.productId())
      .pipe(finalize(() => this.plansLoading.set(false)))
      .subscribe({
        next: (plans) => {
          const durations = plans[0]?.subscriptionDurations ?? [];
          this.durations.set(durations);
          this.selectedDuration.set(durations.find((d) => d.isRecommended) ?? durations[0] ?? null);
          if (durations.length === 0) {
            this.plansError.set('No subscription plans are available for this product yet.');
          }
        },
        error: (error: unknown) => {
          this.plansError.set(error instanceof Error ? error.message : 'Plans could not be loaded.');
        },
      });
  }

  selectDuration(duration: SubscriptionDuration): void {
    this.selectedDuration.set(duration);
    this.couponDiscount.set(0);
    this.appliedCoupon.set('');
    this.purchaseError.set('');
    this.coupon.reset();
  }

  applyCoupon(): void {
    const duration = this.selectedDuration();
    const code = this.coupon.value.trim();
    if (!duration || !code || this.coupon.invalid || this.applyingCoupon()) return;

    this.applyingCoupon.set(true);
    this.purchaseError.set('');
    this.subscriptions
      .validateCoupon(this.productId(), duration.subscriptionDurationId, code)
      .pipe(finalize(() => this.applyingCoupon.set(false)))
      .subscribe({
        next: (result) => {
          this.couponDiscount.set(Math.max(0, Number(result.deductedPrice) || 0));
          this.appliedCoupon.set(code.toUpperCase());
        },
        error: () => {
          this.couponDiscount.set(0);
          this.appliedCoupon.set('');
          this.purchaseError.set('That coupon is invalid or not available for this duration.');
        },
      });
  }

  clearCoupon(): void {
    this.couponDiscount.set(0);
    this.appliedCoupon.set('');
    this.coupon.reset();
  }

  proceedToPay(): void {
    const duration = this.selectedDuration();
    if (!duration || this.paying()) return;

    // Open the tab synchronously (within the click) so pop-up blockers allow it.
    const paymentWindow = window.open('', '_blank');
    this.paying.set(true);
    this.purchaseError.set('');

    const merchantTransactionId = this.newMerchantTransactionId();

    this.subscriptions
      .addPaymentRequest({
        productId: this.productId(),
        amount: this.finalAmount(),
        couponCode: this.appliedCoupon(),
        subscriptionDurationId: duration.subscriptionDurationId,
        merchantTransactionId,
      })
      .pipe(finalize(() => this.paying.set(false)))
      .subscribe({
        next: (result) => {
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
          this.purchaseError.set(
            error instanceof Error ? error.message : 'The payment link could not be created.',
          );
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
        next: (products) => {
          const status = products[0]?.paymentStatus?.toUpperCase();
          if (status === 'SUCCESS') this.onPaymentSuccess();
          else if (status === 'FAILED') this.onPaymentFailed();
          else if (!this.pollSub) this.startPolling();
        },
        error: () => undefined,
      });
  }

  cancelPending(): void {
    this.stopPolling();
    this.payStatus.set('idle');
    this.closed.emit();
  }

  retryFailed(): void {
    this.payStatus.set('idle');
    this.purchaseError.set('');
    if (this.durations().length === 0) this.loadPlans();
  }

  onWindowFocus(): void {
    if (this.payStatus() === 'pending') this.checkStatusNow();
  }

  monogram(name: string): string {
    return (name || '?').trim().slice(0, 1).toUpperCase();
  }

  discountPercent(duration: SubscriptionDuration): number {
    const original = duration.actualPrice ?? 0;
    const base = duration.netPayment ?? original;
    if (original <= 0 || base >= original) return 0;
    return Math.round(((original - base) / original) * 100);
  }

  private startPolling(): void {
    this.stopPolling();
    this.payStatus.set('pending');
    this.pollCount = 0;
    this.pollSub = timer(3000, 4000)
      .pipe(
        switchMap(() =>
          this.subscriptions
            .getPaymentStatusV2(this.paymentRequestId())
            .pipe(catchError(() => of([] as PaymentStatusProduct[]))),
        ),
      )
      .subscribe((products) => {
        this.pollCount += 1;
        const status = products[0]?.paymentStatus?.toUpperCase();
        if (status === 'SUCCESS') this.onPaymentSuccess();
        else if (status === 'FAILED') this.onPaymentFailed();
        else if (this.pollCount >= 75) this.stopPolling();
      });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  private onPaymentSuccess(): void {
    this.stopPolling();
    this.payStatus.set('success');
    this.purchased.emit();
  }

  private onPaymentFailed(): void {
    this.stopPolling();
    this.payStatus.set('failed');
  }

  private newMerchantTransactionId(): string {
    const now = new Date();
    const pad = (value: number, length = 2) => value.toString().padStart(length, '0');
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
    return `RMWEB-${stamp}`;
  }
}
