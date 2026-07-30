import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductListItem } from '../../models/research.models';
import { ProductService } from '../../services/product.service';
import { ResearchAuthService } from '../../services/research-auth.service';

@Component({
  selector: 'app-research-products',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './research-products.component.html',
  styleUrl: './research-products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchProductsComponent implements OnInit {
  private readonly products = inject(ProductService);
  private readonly auth = inject(ResearchAuthService);
  private readonly router = inject(Router);

  readonly search = new FormControl('', { nonNullable: true });
  private readonly searchTerm = toSignal(this.search.valueChanges, { initialValue: '' });

  readonly items = signal<ProductListItem[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly activeCategory = signal<string>('all');
  readonly session = this.auth.session;

  readonly categories = computed(() => {
    const set = new Set<string>();
    for (const product of this.items()) {
      const category = (product.category || product.groupName || '').trim();
      if (category) set.add(category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  readonly visibleItems = computed(() => {
    const category = this.activeCategory();
    const term = this.searchTerm().trim().toLowerCase();
    return this.items().filter((product) => {
      const inCategory =
        category === 'all' || (product.category || product.groupName || '').trim() === category;
      const inTerm =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        (product.description || '').toLowerCase().includes(term) ||
        (product.category || '').toLowerCase().includes(term);
      return inCategory && inTerm;
    });
  });

  ngOnInit(): void {
    this.load();
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

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  openProduct(product: ProductListItem): void {
    void this.router.navigate(['/research/products', product.id]);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  monogram(name: string): string {
    return (name || '?').trim().slice(0, 1).toUpperCase();
  }
}
