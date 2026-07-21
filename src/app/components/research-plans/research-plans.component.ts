import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, filter, map, of, switchMap, take, timer } from 'rxjs';
import { SubscriptionDuration } from '../../models/research.models';
import { ResearchSubscriptionService } from '../../services/research-subscription.service';

@Component({
  selector: 'app-research-plans',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './research-plans.component.html',
  styleUrl: './research-plans.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchPlansComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subscriptions = inject(ResearchSubscriptionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly paying = signal(false);
  readonly checkingPayment = signal(false);
  readonly applyingCoupon = signal(false);
  readonly errorMessage = signal('');
  readonly paymentMessage = signal('');
  readonly paymentRequestId = signal('');
  readonly planName = signal('Research Report');
  readonly durations = signal<SubscriptionDuration[]>([]);
  readonly selectedDuration = signal<SubscriptionDuration | null>(null);
  readonly couponDiscount = signal(0);
  readonly appliedCoupon = signal('');

  readonly coupon = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(50)] });
  readonly acceptedRisk = new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] });

  readonly finalAmount = computed(() => {
    const plan = this.selectedDuration();
    return plan ? Math.max(0, Math.trunc(plan.netPayment - this.couponDiscount())) : 0;
  });

  private readonly productId = this.readProductId();
  private readonly returnUrl = this.readReturnUrl();

  constructor() {
    this.loadPlans();
  }

  selectDuration(duration: SubscriptionDuration): void {
    this.selectedDuration.set(duration);
    this.couponDiscount.set(0);
    this.appliedCoupon.set('');
    this.coupon.reset();
    this.errorMessage.set('');
  }

  applyCoupon(): void {
    const duration = this.selectedDuration();
    const code = this.coupon.value.trim();
    if (!duration || !code || this.coupon.invalid) return;

    this.applyingCoupon.set(true);
    this.errorMessage.set('');
    this.subscriptions
      .validateCoupon(this.productId, duration.subscriptionDurationId, code)
      .subscribe({
        next: (result) => {
          this.couponDiscount.set(Math.max(0, Number(result.deductedPrice) || 0));
          this.appliedCoupon.set(code.toUpperCase());
          this.applyingCoupon.set(false);
        },
        error: () => {
          this.errorMessage.set('That coupon is invalid or is not available for this duration.');
          this.applyingCoupon.set(false);
        },
      });
  }

  startPayment(): void {
    const duration = this.selectedDuration();
    if (!duration) return;
    if (this.acceptedRisk.invalid) {
      this.acceptedRisk.markAsTouched();
      this.errorMessage.set('Please accept the risk declaration before continuing.');
      return;
    }

    const paymentWindow = window.open('', 'research-mantra-payment');
    this.paying.set(true);
    this.errorMessage.set('');
    this.paymentMessage.set('Creating your secure payment link…');

    this.subscriptions
      .createPaymentRequest(this.productId, duration, this.finalAmount(), this.appliedCoupon())
      .subscribe({
        next: (payment) => {
          this.paymentRequestId.set(payment.link_id);
          if (paymentWindow) {
            paymentWindow.location.href = payment.link_url;
            paymentWindow.focus();
          } else {
            window.location.assign(payment.link_url);
            return;
          }
          this.paying.set(false);
          this.paymentMessage.set('Complete the payment in the secure window. We will unlock Research automatically.');
          this.pollPaymentStatus();
        },
        error: (error: unknown) => {
          paymentWindow?.close();
          this.paying.set(false);
          this.paymentMessage.set('');
          this.errorMessage.set(error instanceof Error ? error.message : 'The payment link could not be created.');
        },
      });
  }

  checkPaymentNow(): void {
    if (!this.paymentRequestId()) return;
    this.checkingPayment.set(true);
    this.subscriptions.getPaymentStatus(this.paymentRequestId()).subscribe({
      next: (status) => {
        this.checkingPayment.set(false);
        if (status.link_status?.toUpperCase() === 'PAID') {
          this.finishPayment();
          return;
        }
        this.paymentMessage.set('Payment is still pending. Complete it in the secure window, then check again.');
      },
      error: () => {
        this.checkingPayment.set(false);
        this.paymentMessage.set('We could not confirm the payment yet. Please try again in a moment.');
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }

  private loadPlans(): void {
    if (this.productId <= 0) {
      this.loading.set(false);
      this.errorMessage.set('The Research product could not be identified. Return to the library and try again.');
      return;
    }

    this.subscriptions.getPlans(this.productId).subscribe({
      next: (plans) => {
        const researchPlan = plans.find((plan) => plan.subscriptionPlanId === 24) ?? plans[0];
        const durations = researchPlan?.subscriptionDurations ?? [];
        this.planName.set(researchPlan?.name || 'Research Report');
        this.durations.set(durations);
        this.selectedDuration.set(durations[0] ?? null);
        this.loading.set(false);
        if (durations.length === 0) this.errorMessage.set('No active Research subscription durations are available.');
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(error instanceof Error ? error.message : 'Research plans could not be loaded.');
      },
    });
  }

  private pollPaymentStatus(): void {
    timer(2000, 3000)
      .pipe(
        switchMap(() => this.subscriptions.getPaymentStatus(this.paymentRequestId()).pipe(catchError(() => of(null)))),
        map((status) => status?.link_status?.toUpperCase() === 'PAID'),
        filter(Boolean),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.finishPayment());
  }

  private finishPayment(): void {
    this.checkingPayment.set(false);
    this.paymentMessage.set('Payment confirmed. Your Research access is active.');
    window.setTimeout(() => void this.router.navigateByUrl(this.returnUrl), 700);
  }

  private readProductId(): number {
    const value = Number(this.route.snapshot.queryParamMap.get('productId'));
    return Number.isInteger(value) && value > 0 ? value : 155;
  }

  private readReturnUrl(): string {
    const value = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/research';
    return value.startsWith('/') && !value.startsWith('//') ? value : '/research';
  }
}
