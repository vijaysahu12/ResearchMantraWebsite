import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef, QueryList, ElementRef, ViewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LeadService } from '../../services/lead.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

interface FeatureRow {
    name: string;
    cashPositional: string;
    fatafatOptions: string;
    huntingFuture: string;
}

@Component({
    selector: 'app-pricing-plans',
    standalone: true,
    imports: [RouterLink, CommonModule, ReactiveFormsModule],
    templateUrl: './pricing-plans.component.html',
    styleUrl: './pricing-plans.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingPlansComponent {
    private fb = inject(FormBuilder);
    private http = inject(HttpClient);
    private leadService = inject(LeadService);
    private destroyRef = inject(DestroyRef);

    // Modal State
    isModalOpen = signal(false);
    currentStep = signal<'form' | 'otp' | 'success'>('form');
    isLoading = signal(false);
    errorMessage = signal('');
    timer = signal(0);
    canResend = signal(false);
    private timerInterval: any;

    // Form
    reportForm: FormGroup;
    otpForm: FormGroup;

    @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

    constructor() {
        this.reportForm = this.fb.group({
            fullName: ['', [Validators.required, Validators.minLength(2)]],
            language: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
            mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
            acceptTerms: [false, Validators.requiredTrue]
        });

        this.otpForm = this.fb.group({
            otp: this.fb.array(Array(6).fill('').map(() =>
                this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)])
            ))
        });
    }

    get otpDigits() {
        return this.otpForm.get('otp') as FormArray;
    }

    openReportModal() {
        this.isModalOpen.set(true);
        this.currentStep.set('form');
        this.errorMessage.set('');
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.stopTimer();
    }

    generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    onSendOtp() {
        if (this.reportForm.invalid) {
            this.reportForm.markAllAsTouched();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const formValue = this.reportForm.value;
        const now = new Date().toISOString();

        // Save Lead first
        const leadPayload: any = {
            Id: 0,
            PublicKey: this.generateGuid(),
            FullName: formValue.fullName,
            Gender: '',
            CountryCode: '+91',
            MobileNumber: formValue.mobile,
            AlternateMobileNumber: '',
            EmailId: formValue.email,
            ProfileImage: '',
            PriorityStatus: 'Normal',
            AssignedTo: '',
            ServiceKey: '',
            LeadTypeKey: '',
            LeadSourceKey: 'Report Download',
            Remarks: `Language: ${formValue.language}`,
            IsDisabled: 0,
            IsDelete: 0,
            CreatedOn: now,
            CreatedBy: 'Website',
            IsSpam: 0,
            IsWon: 0,
            ModifiedOn: now,
            ModifiedBy: 'Website',
            City: '',
            PinCode: '',
            StatusId: 1,
            Favourite: false,
            PurchaseOrderKey: null
        };

        this.http.post('https://crmapi.researchmantra.in/api/Leads/WebsiteLeads', leadPayload)
            .pipe(
                switchMap(() => this.leadService.sendOtp({
                    mobileNumber: formValue.mobile,
                    countryCode: '+91'
                })),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.currentStep.set('otp');
                    this.startTimer(300);
                    setTimeout(() => {
                        this.otpInputs?.first?.nativeElement.focus();
                    }, 100);
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err.error?.message || 'Failed to send OTP. Please try again.');
                }
            });
    }

    onOtpVerify() {
        if (this.otpForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const otp = this.otpDigits.controls.map(c => c.value).join('');
        const mobile = this.reportForm.get('mobile')?.value;

        this.leadService.verifyOtp({ mobileNumber: mobile, otp: otp })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.currentStep.set('success');
                    this.stopTimer();

                    // Track GTM Event
                    if (typeof (window as any).gtag === 'function') {
                        (window as any).gtag('event', 'lead_submit', {
                            form_type: 'report_download',
                            page_location: window.location.href
                        });
                    }

                    // Trigger PDF download after short delay
                    setTimeout(() => {
                        window.open('assets/Research-Mantra-Report.pdf', '_blank');
                    }, 1000);
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err.error?.message || 'Invalid OTP. Please try again.');
                }
            });
    }

    // OTP UI Helpers
    onOtpInput(index: number, event: any) {
        const input = event.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '');
        if (value.length > 1) value = value[0];
        input.value = value;
        this.otpDigits.at(index).setValue(value);
        if (value && index < 5) {
            this.otpInputs.get(index + 1)?.nativeElement.focus();
        }
    }

    onOtpKeyDown(index: number, event: KeyboardEvent) {
        if (event.key === 'Backspace' && !this.otpDigits.at(index).value && index > 0) {
            this.otpInputs.get(index - 1)?.nativeElement.focus();
        }
    }

    // Timer Logic
    startTimer(seconds: number) {
        this.stopTimer();
        this.timer.set(seconds);
        this.canResend.set(false);
        this.timerInterval = setInterval(() => {
            const current = this.timer();
            if (current > 0) {
                this.timer.set(current - 1);
            } else {
                this.canResend.set(true);
                this.stopTimer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
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
