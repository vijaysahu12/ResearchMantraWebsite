import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { GroupedPurchaseOrder, GroupedReceipt, MyBucketItem, PurchaseHistoryItem } from '../../models/research.models';
import { ResearchSubscriptionService } from '../../services/research-subscription.service';
import { PurchaseDialogComponent } from '../purchase-dialog/purchase-dialog.component';

@Component({
  selector: 'app-research-purchases',
  imports: [RouterLink, DatePipe, DecimalPipe, PurchaseDialogComponent],
  templateUrl: './research-purchases.component.html',
  styleUrls: ['./research-purchases.component.css', './research-purchases.bucket.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchPurchasesComponent {
  private readonly subscriptions = inject(ResearchSubscriptionService);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly activeView = signal<'bucket' | 'purchases'>('bucket');
  readonly bucket = signal<MyBucketItem[]>([]);
  readonly purchases = signal<GroupedPurchaseOrder[]>([]);
  readonly receipt = signal<GroupedReceipt | null>(null);
  readonly showRenew = signal(false);
  readonly renewItem = signal<MyBucketItem | null>(null);

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set('');
    let bucketFailed = false;
    let purchasesFailed = false;
    forkJoin({
      bucket: this.subscriptions.getMyBucket().pipe(catchError(() => { bucketFailed = true; return of([]); })),
      purchases: this.subscriptions.getGroupedPurchaseHistory().pipe(
        catchError(() =>
          this.subscriptions.getPurchaseHistory().pipe(
            map(items => this.groupPurchaseItems(items)),
            catchError(() => { purchasesFailed = true; return of([] as GroupedPurchaseOrder[]); }),
          )
        ),
      ),
    }).subscribe({
      next: ({ bucket, purchases }) => {
        this.bucket.set(bucket);
        this.purchases.set(purchases);
        if (bucketFailed && purchasesFailed) this.error.set('Your products and purchase history could not be loaded.');
        else if (bucketFailed) this.error.set('My Bucket could not be loaded.');
        else if (purchasesFailed) this.error.set('Purchase history could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  isBucketActive(item: MyBucketItem): boolean {
    return !item.enddate || new Date(item.enddate).getTime() >= Date.now();
  }

  show(view: 'bucket' | 'purchases'): void {
    this.activeView.set(view);
    if (view === 'bucket') this.receipt.set(null);
  }

  openRenew(item: MyBucketItem): void {
    this.renewItem.set(item);
    this.showRenew.set(true);
  }

  onRenewed(): void {
    this.load();
  }

  viewReceipt(transactionId: string): void {
    this.error.set('');
    this.subscriptions.getGroupedReceipt(transactionId).subscribe({
      next: (receipt) => this.receipt.set(receipt),
      error: () => this.error.set('This receipt is unavailable.'),
    });
  }

  printReceipt(): void { window.print(); }

  private groupPurchaseItems(items: PurchaseHistoryItem[]): GroupedPurchaseOrder[] {
    const groups = new Map<string, GroupedPurchaseOrder>();
    for (const item of items) {
      const key = item.transactionId ?? `single-${item.id}`;
      const existing = groups.get(key);
      if (existing) {
        existing.productCount++;
        if (item.productName) existing.productNames.push(item.productName);
        existing.purchaseOrderIds.push(item.id);
      } else {
        groups.set(key, {
          transactionId: key,
          paymentDate: item.paymentDate,
          paidAmount: item.paidAmount ?? 0,
          productCount: 1,
          productNames: item.productName ? [item.productName] : [],
          purchaseOrderIds: [item.id],
        });
      }
    }
    return [...groups.values()];
  }
}
