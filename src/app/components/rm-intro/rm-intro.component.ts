import { Component, ChangeDetectionStrategy, signal, inject, ElementRef, ViewChildren, QueryList, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormArray } from '@angular/forms';
import { LeadService, SendOtpRequest, VerifyOtpRequest, WebsiteLead } from '../../services/lead.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';

type Step = 'mobile' | 'name' | 'otp' | 'success';

@Component({
    selector: 'app-rm-intro',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './rm-intro.component.html',
    styleUrl: './rm-intro.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RmIntroComponent implements OnInit {
    private fb = inject(FormBuilder);
    private leadService = inject(LeadService);
    private destroyRef = inject(DestroyRef);
    private http = inject(HttpClient);

    // State Signals
    currentStep = signal<Step>('mobile');
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');
    timer = signal<number>(0);
    canResend = signal<boolean>(false);
    mobileNumber = signal<string>('');
    userName = signal<string>('');
    youtubeLink = signal<string>('');

    // UI References
    @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

    // Forms
    mobileForm: FormGroup;
    nameForm: FormGroup;
    otpForm: FormGroup;

    constructor() {
        this.mobileForm = this.fb.group({
            mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]]
        });

        this.nameForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]]
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

    ngOnInit() {
        // Restore state from sessionStorage if available
        const savedState = sessionStorage.getItem('leadState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (state.mobile) this.mobileNumber.set(state.mobile);
                if (state.name) this.userName.set(state.name);
                if (state.youtubeLink) this.youtubeLink.set(state.youtubeLink);
                if (state.step) {
                    this.currentStep.set(state.step as Step);
                    if (state.step === 'otp') {
                        const now = Date.now();
                        const expiresAt = state.expiresAt || 0;
                        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
                        if (remaining > 0) {
                            this.startTimer(remaining);
                        } else {
                            this.canResend.set(true);
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to restore state', e);
                sessionStorage.removeItem('leadState');
            }
        }
    }

    // Helper: Generate Guid
    generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    onNameInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value.replace(/[0-9]/g, '');
        input.value = value;
        this.nameForm.get('name')?.setValue(value, { emitEvent: false });
        input.setSelectionRange(start, end);
    }

    onMobileNumberInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value.replace(/\D/g, '');
        input.value = value;
        this.mobileForm.get('mobile')?.setValue(value, { emitEvent: false });
        input.setSelectionRange(start, end);
    }

    // Step 1: Mobile Submit
    onMobileSubmit() {
        if (this.mobileForm.invalid) return;

        const mobile = this.mobileForm.get('mobile')?.value;
        this.mobileNumber.set(mobile);
        this.errorMessage.set('');

        // Move to step 2
        this.currentStep.set('name');
        this.saveState();
    }

    // Step 2: Name Submit -> API Call (Save Lead + Send OTP)
    onNameSubmit() {
        if (this.nameForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const name = this.nameForm.get('name')?.value;
        this.userName.set(name);

        const now = new Date().toISOString();

        // 1. Prepare WebsiteLead payload
        const leadPayload: WebsiteLead = {
            Id: 0,
            PublicKey: this.generateGuid(),
            FullName: name,
            Gender: '',
            CountryCode: '+91',
            MobileNumber: this.mobileNumber(),
            AlternateMobileNumber: '',
            EmailId: '',
            ProfileImage: '',
            PriorityStatus: 'Normal',
            AssignedTo: '',
            ServiceKey: '',
            LeadTypeKey: '',
            LeadSourceKey: 'Website Enquiry',
            Remarks: 'Unlock 3 Free Trade Ideas Flow',
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

        // 2. Prepare OTP payload
        const otpPayload: SendOtpRequest = {
            mobileNumber: this.mobileNumber(),
            countryCode: '+91',
        };

        // 3. Execute: Save Lead -> Send OTP
        this.http.post('https://crmapi.researchmantra.in/api/Leads/WebsiteLeads', leadPayload)
            .pipe(
                switchMap(() => this.leadService.sendOtp(otpPayload)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.currentStep.set('otp');
                    this.startTimer(300); // 5 minutes
                    this.saveState();
                    // Focus first OTP input
                    setTimeout(() => {
                        const firstInput = this.otpInputs?.first?.nativeElement;
                        if (firstInput) firstInput.focus();
                    }, 100);
                },
                error: (err: any) => {
                    console.error('Error in lead flow', err);
                    this.isLoading.set(false);
                    this.errorMessage.set(err.error?.message || 'Something went wrong. Please try again.');
                }
            });
    }

    // Step 3: OTP Logic
    onOtpInput(index: number, event: any) {
        const input = event.target as HTMLInputElement;
        let value = input.value;

        value = value.replace(/\D/g, '');

        if (!value) return;

        if (value.length > 1) {
            value = value[0];
            input.value = value;
        }

        this.otpDigits.at(index).setValue(value);

        if (value && index < 5) {
            const nextInput = this.otpInputs.get(index + 1)?.nativeElement;
            if (nextInput) nextInput.focus();
        }
    }

    onOtpKeyDown(index: number, event: KeyboardEvent) {
        if (event.key === 'Backspace' && !this.otpDigits.at(index).value && index > 0) {
            const prevInput = this.otpInputs.get(index - 1)?.nativeElement;
            if (prevInput) prevInput.focus();
        }
    }

    onOtpPaste(event: ClipboardEvent) {
        event.preventDefault();
        const clipboardData = event.clipboardData?.getData('text') || '';
        const digits = clipboardData.replace(/\D/g, '').split('').slice(0, 6);

        if (digits.length > 0) {
            digits.forEach((digit, i) => {
                if (i < 6) this.otpDigits.at(i).setValue(digit);
            });

            const focusIndex = Math.min(digits.length, 5);
            const focusInput = this.otpInputs.get(focusIndex)?.nativeElement;
            if (focusInput) focusInput.focus();
        }
    }

    // Step 4: Verify OTP
    onOtpVerify() {
        if (this.otpForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const otp = this.otpDigits.controls.map(c => c.value).join('');

        const request: VerifyOtpRequest = {
            mobileNumber: this.mobileNumber(),
            otp: otp
        };

        this.leadService.verifyOtp(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.currentStep.set('success');
                    this.youtubeLink.set('https://www.youtube.com/watch?v=6RbqRDqKdjc');
                    sessionStorage.removeItem('leadState');
                    this.stopTimer();
                },
                error: (err: any) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err.error?.message || 'Invalid OTP. Please try again.');
                }
            });
    }

    resendOtp() {
        if (!this.canResend()) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const request: SendOtpRequest = {
            mobileNumber: this.mobileNumber(),
            countryCode: '+91'
        };

        this.leadService.sendOtp(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isLoading.set(false);
                    this.startTimer(30); // 30s cooldown for resend
                    this.errorMessage.set('OTP resent successfully!');
                    setTimeout(() => this.errorMessage.set(''), 3000);
                },
                error: (err: any) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err.error?.message || 'Failed to resend OTP.');
                }
            });
    }

    // Timer Logic
    private timerInterval: any;

    startTimer(seconds: number) {
        this.stopTimer();
        this.timer.set(seconds);
        this.canResend.set(false);

        const expiresAt = Date.now() + (seconds * 1000);
        this.saveStateWithExpiration(expiresAt);

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

    // Copy Link Logic
    copyLink() {
        const link = this.youtubeLink();
        if (!link) return;

        navigator.clipboard.writeText(link).then(() => {
            const btn = document.getElementById('copyBtn');
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                setTimeout(() => { if (btn) btn.innerText = originalText; }, 2000);
            }
        });
    }

    saveState() {
        const state = {
            step: this.currentStep(),
            mobile: this.mobileNumber(),
            name: this.userName(),
            youtubeLink: this.youtubeLink()
        };
        sessionStorage.setItem('leadState', JSON.stringify(state));
    }

    saveStateWithExpiration(expiresAt: number) {
        const state = {
            step: this.currentStep(),
            mobile: this.mobileNumber(),
            name: this.userName(),
            expiresAt: expiresAt,
            youtubeLink: this.youtubeLink()
        };
        sessionStorage.setItem('leadState', JSON.stringify(state));
    }
}
