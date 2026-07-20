import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ResearchSubscriptionService } from '../../services/research-subscription.service';

@Component({
  selector: 'app-research-test-payment',
  imports: [RouterLink],
  templateUrl: './research-test-payment.component.html',
  styleUrl: './research-test-payment.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchTestPaymentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subscriptions = inject(ResearchSubscriptionService);

  readonly linkId = this.route.snapshot.queryParamMap.get('linkId') ?? '';
  readonly loading = signal(true);
  readonly completing = signal(false);
  readonly completed = signal(false);
  readonly amount = signal(0);
  readonly errorMessage = signal('');

  constructor() {
    if (!this.linkId) {
      this.loading.set(false);
      this.errorMessage.set('The test payment order could not be identified.');
      return;
    }

    this.subscriptions.getPaymentStatus(this.linkId).subscribe({
      next: (status) => {
        this.amount.set(Number(status.link_amount) || 0);
        this.completed.set(status.link_status?.toUpperCase() === 'PAID');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('The local test payment order could not be loaded.');
      },
    });
  }

  completePayment(): void {
    if (this.completing() || this.completed()) return;
    this.completing.set(true);
    this.errorMessage.set('');

    this.subscriptions.completeTestPayment(this.linkId).subscribe({
      next: (status) => {
        this.completing.set(false);
        this.completed.set(status.link_status?.toUpperCase() === 'PAID');
        window.setTimeout(() => this.finish(), 1000);
      },
      error: () => {
        this.completing.set(false);
        this.errorMessage.set('The local test payment could not be completed.');
      },
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private finish(): void {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    void this.router.navigate(['/research']);
  }
}
