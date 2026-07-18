import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PurchaseHistoryItem } from '../../models/research.models';
import { ResearchSubscriptionService } from '../../services/research-subscription.service';

@Component({
  selector: 'app-research-purchases',
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './research-purchases.component.html',
  styleUrl: './research-purchases.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchPurchasesComponent {
  private readonly subscriptions = inject(ResearchSubscriptionService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly purchases = signal<PurchaseHistoryItem[]>([]);
  readonly receipt = signal<PurchaseHistoryItem | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set('');
    this.subscriptions.getPurchaseHistory().subscribe({
      next: (rows) => { this.purchases.set(rows); this.loading.set(false); },
      error: () => { this.error.set('Purchase history could not be loaded.'); this.loading.set(false); },
    });
  }

  viewReceipt(id: number): void {
    this.error.set('');
    this.subscriptions.getReceipt(id).subscribe({
      next: (receipt) => this.receipt.set(receipt),
      error: () => this.error.set('This receipt is unavailable.'),
    });
  }

  printReceipt(): void { window.print(); }
}
