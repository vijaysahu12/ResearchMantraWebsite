import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductListItem } from '../../models/research.models';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home-products',
  imports: [DecimalPipe],
  templateUrl: './home-products.component.html',
  styleUrl: './home-products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeProductsComponent implements OnInit {
  private readonly products = inject(ProductService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly items = signal<ProductListItem[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

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
    this.errorMessage.set('');
    this.products
      .getProducts()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : '';
          this.errorMessage.set(message || 'We could not load the products right now.');
        },
      });
  }

  openProduct(id: number): void {
    void this.router.navigate(['/research/products', id]);
  }

  monogram(name: string): string {
    return (name || '?').trim().slice(0, 1).toUpperCase();
  }
}
