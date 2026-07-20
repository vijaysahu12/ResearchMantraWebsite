import {
    Component, ChangeDetectionStrategy, inject,
    AfterViewInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-complaints-summary',
    standalone: true,
    imports: [],
    template: `
<section class="complaints-section">
    <!-- Smooth transition + decorative background -->
    <div class="cs-bg" aria-hidden="true">
        <span class="cs-blob"></span>
    </div>

    <div class="container" #revealRoot>
        <div class="cs-eyebrow">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            SEBI Compliance
        </div>
        <h2 class="section-title">Number Of Client's Complaints</h2>
        <p class="update-note">Data of the month ending Jan, 2026 (Data is updated on 7th of every month)</p>

        <div class="table-container">
            <div class="table-wrapper" role="region" tabindex="0" aria-label="Complaints summary table">
                <table class="complaints-table">
                    <thead>
                        <tr>
                            <th>Received from</th>
                            <th>Pending at the end of last month</th>
                            <th>Received</th>
                            <th>Resolved</th>
                            <th>Total Pending</th>
                            <th>Pending complaints &gt; 3 months</th>
                            <th>Average Resolution time (in days)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Directly from investor</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                        </tr>
                        <tr>
                            <td>SEBI (SCORES)</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                        </tr>
                        <tr>
                            <td>Other Sources (if any)</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><strong>Grand Total</strong></td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</section>
    `,
    styleUrl: './complaints-summary.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComplaintsSummaryComponent implements AfterViewInit, OnDestroy {
    private platformId = inject(PLATFORM_ID);
    private observer: IntersectionObserver | null = null;
    private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    @ViewChild('revealRoot') revealRoot!: ElementRef<HTMLElement>;

    ngAfterViewInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const el = this.revealRoot?.nativeElement;
        const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

        // If we can't animate safely, leave content fully visible.
        if (!el || !motionOk || typeof IntersectionObserver === 'undefined') return;

        el.classList.add('reveal-init');

        try {
            this.observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.reveal(el);
                        break;
                    }
                }
            }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
            this.observer.observe(el);
        } catch {
            this.reveal(el);
        }

        // Safety net so content can never stay hidden.
        this.fallbackTimer = setTimeout(() => this.reveal(el), 1500);
    }

    private reveal(el: HTMLElement): void {
        el.classList.add('reveal-in');
        this.observer?.disconnect();
        this.observer = null;
        if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
        }
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
    }
}
