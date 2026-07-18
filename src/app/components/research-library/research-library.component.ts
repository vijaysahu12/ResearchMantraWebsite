import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ResearchCompany } from '../../models/research.models';
import { ResearchAuthService } from '../../services/research-auth.service';
import { ResearchService } from '../../services/research.service';

type MarketCapFilter = 'all' | 'large' | 'emerging';

@Component({
  selector: 'app-research-library',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './research-library.component.html',
  styleUrl: './research-library.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchLibraryComponent implements OnInit {
  private readonly researchService = inject(ResearchService);
  private readonly auth = inject(ResearchAuthService);
  private readonly router = inject(Router);

  readonly search = new FormControl('', { nonNullable: true });
  readonly companies = signal<ResearchCompany[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly hasResearchProduct = signal(false);
  readonly researchProductId = signal(155);
  readonly activeFilter = signal<MarketCapFilter>('all');
  readonly session = this.auth.session;

  readonly filteredCompanies = computed(() => {
    const filter = this.activeFilter();
    return this.companies().filter((company) => {
      if (filter === 'large') return (company.marketCap ?? 0) >= 500;
      if (filter === 'emerging') return (company.marketCap ?? 0) < 500;
      return true;
    });
  });

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.researchService
      .getCompanies(this.search.value)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.companies.set(result.companyData ?? []);
          this.hasResearchProduct.set(Boolean(result.hasResearchProduct));
          const productId = result.companyData?.find((company) => company.productId > 0)?.productId;
          if (productId) this.researchProductId.set(productId);
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : '';
          this.errorMessage.set(message || 'We could not load the research library.');
        },
      });
  }

  setFilter(filter: MarketCapFilter): void {
    this.activeFilter.set(filter);
  }

  openReport(company: ResearchCompany, visibleIndex: number): void {
    const page = this.companies().indexOf(company) + 1 || visibleIndex + 1;
    if (!this.hasResearchProduct() && !company.isFree) {
      const returnUrl = this.router.createUrlTree(['/research/report'], {
        queryParams: { page, name: company.name },
      }).toString();
      void this.router.navigate(['/research/plans'], {
        queryParams: { productId: company.productId, returnUrl },
      });
      return;
    }

    void this.router.navigate(['/research/report'], {
      queryParams: { page, name: company.name },
    });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  formatMetric(value?: number): string {
    return value == null ? '—' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);
  }
}
