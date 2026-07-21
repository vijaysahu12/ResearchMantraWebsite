import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CompanyReport } from '../../models/research.models';
import { ResearchService } from '../../services/research.service';

@Component({
  selector: 'app-research-report',
  imports: [RouterLink],
  templateUrl: './research-report.component.html',
  styleUrl: './research-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchReportComponent implements OnInit {
  private readonly researchService = inject(ResearchService);
  private readonly route = inject(ActivatedRoute);

  readonly report = signal<CompanyReport | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly requestedName = signal(this.route.snapshot.queryParamMap.get('name') || 'Company report');

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    const page = Math.max(1, Number(this.route.snapshot.queryParamMap.get('page')) || 1);
    this.loading.set(true);
    this.errorMessage.set('');
    this.researchService
      .getCompanyReport(page)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (report) => this.report.set(report),
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : '';
          this.errorMessage.set(message || 'This report could not be opened.');
        },
      });
  }

  formatNumber(value?: number): string {
    return value == null ? '—' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);
  }
}
