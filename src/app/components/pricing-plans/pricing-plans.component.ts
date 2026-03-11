import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface FeatureRow {
    name: string;
    cashPositional: string;
    fatafatOptions: string;
    huntingFuture: string;
}

@Component({
    selector: 'app-pricing-plans',
    standalone: true,
    imports: [RouterLink, ReactiveFormsModule],
    templateUrl: './pricing-plans.component.html',
    styleUrl: './pricing-plans.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingPlansComponent {
    private fb = inject(FormBuilder);

    // Modal State
    isModalOpen = signal(false);
    isLoading = signal(false);
    errorMessage = signal('');
    noRecordsFound = signal(false);

    private http = inject(HttpClient);

    // Form
    reportForm: FormGroup;

    constructor() {
        this.reportForm = this.fb.group({
            fromDate: [''],
            toDate: ['']
        });
    }

    openReportModal() {
        this.isModalOpen.set(true);
        this.errorMessage.set('');
        this.noRecordsFound.set(false);
        this.reportForm.reset({ fromDate: '', toDate: '' });
    }

    closeModal() {
        this.isModalOpen.set(false);
    }

    isDateRangeInvalid(): boolean {
        const from = this.reportForm.get('fromDate')?.value;
        const to = this.reportForm.get('toDate')?.value;
        if (from && to) {
            return new Date(to) < new Date(from);
        }
        return false;
    }


    onDownloadDirect() {
        if (this.isDateRangeInvalid()) {
            this.errorMessage.set('To Date cannot be earlier than From Date');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.noRecordsFound.set(false);

        const fromDate = this.reportForm.get('fromDate')?.value || '';
        const toDate = this.reportForm.get('toDate')?.value || '';
        const apiUrl = `https://crmapi.researchmantra.in/api/PdfReports/generate?fromDate=${fromDate}&toDate=${toDate}`;

        this.http.get(apiUrl, { responseType: 'blob', observe: 'response' }).subscribe({
            next: (response) => {
                this.isLoading.set(false);

                // Check if the response is actually a PDF
                if (response.body && response.body.type === 'application/pdf') {
                    const blob = new Blob([response.body], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `PerformanceReport_${fromDate}_to_${toDate}.pdf`;
                    link.click();
                    window.URL.revokeObjectURL(url);
                    this.closeModal();
                } else {
                    // If not a PDF, it might be an empty body or JSON message
                    this.noRecordsFound.set(true);
                }

                if (typeof (window as any).gtag === 'function') {
                    (window as any).gtag('event', 'report_download_success', {
                        date_from: fromDate,
                        date_to: toDate
                    });
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                console.error('Download failed', err);

                // Many times 404 or 204 is returned when no records exist
                if (err.status === 404 || err.status === 204) {
                    this.noRecordsFound.set(true);
                } else {
                    this.errorMessage.set('No Reports Found!');
                }
            }
        });
    }

    features = signal<FeatureRow[]>([
        {
            name: 'Ideal For',
            cashPositional: 'Who focused on index trading',
            fatafatOptions: 'Active intraday options traders',
            huntingFuture: 'Serious traders seeking dedicated personal guidance'
        },
        {
            name: 'Trading Focus',
            cashPositional: 'Only Nifty options or Bank Nifty options calls',
            fatafatOptions: 'Nifty intraday option buy calls',
            huntingFuture: 'Stock Options only'
        },
        {
            name: 'Capital Required',
            cashPositional: '₹3,00,000 and above',
            fatafatOptions: '₹50,000 and above',
            huntingFuture: '₹5,00,000 and above'
        },
        {
            name: 'Trade Frequency',
            cashPositional: '1 index call per day',
            fatafatOptions: '1–2 intraday trades daily2–3 trades per session',
            huntingFuture: '12–15 calls per month (Maximum 1 call per day)'
        },
        {
            name: 'Alerts & Support',
            cashPositional: 'WhatsApp support during market hours',
            fatafatOptions: 'WhatsApp trade alerts and live support',
            huntingFuture: 'Dedicated personal support during market hours'
        },
        {
            name: 'Trade Details Provided',
            cashPositional: 'Target and stop-loss for every trade',
            fatafatOptions: 'Clear entry, target, and stop-loss',
            huntingFuture: 'Target and stop-loss for every trade'
        },
        {
            name: 'Risk Management',
            cashPositional: 'Defined stop-loss on all trades',
            fatafatOptions: 'Strict intraday risk controls',
            huntingFuture: 'Defined stop-loss on all trades'
        }
    ]);
}
