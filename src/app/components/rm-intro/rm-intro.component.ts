import { Component, ChangeDetectionStrategy, signal, inject, ElementRef, ViewChild, ViewChildren, QueryList, DestroyRef, OnInit, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormArray } from '@angular/forms';
import { LeadService, SendOtpRequest, VerifyOtpRequest, WebsiteLead } from '../../services/lead.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

type Step = 'mobile' | 'name' | 'otp' | 'success';

@Component({
    selector: 'app-rm-intro',
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './rm-intro.component.html',
    styleUrl: './rm-intro.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RmIntroComponent implements OnInit, AfterViewInit {
    private fb = inject(FormBuilder);
    private leadService = inject(LeadService);
    private destroyRef = inject(DestroyRef);
    private http = inject(HttpClient);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    // Limited-offer countdown (rolling weekly deadline — resets every Sunday)
    countdown = signal<{ d: string; h: string; m: string; s: string }>({ d: '00', h: '00', m: '00', s: '00' });
    private countdownTimer: ReturnType<typeof setInterval> | null = null;

    // Confetti
    showConfetti = signal<boolean>(false);
    private offerObserver: IntersectionObserver | null = null;
    private confettiTimer: ReturnType<typeof setTimeout> | null = null;
    @ViewChild('offerCard') offerCardRef?: ElementRef<HTMLElement>;

    readonly confettiPieces = Array.from({ length: 44 }, (_, i) => {
        const colors = ['#FACC15', '#f8b018', '#ff9500', '#22c55e', '#3b82f6', '#ef4444', '#ffffff', '#a855f7'];
        return {
            left: (i * 23 + (i % 5) * 9) % 100,
            color: colors[i % colors.length],
            duration: 1400 + (i % 8) * 170,
            delay: (i % 12) * 45,
            xEnd: (((i * 61) % 220) - 110) + 'px',
            rot: ((i * 53) % 6 * 90 + 180) + 'deg'
        };
    });

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
    enquiryForm: FormGroup;
    isEnquirySubmitting = signal<boolean>(false);
    enquirySuccess = signal<string>('');
    showStrategyModal = signal<boolean>(false);
    activeFormTab = signal<'telegram' | 'enquiry' | 'youtube'>('telegram');

    private readonly TAB_ORDER: Array<'telegram' | 'enquiry' | 'youtube'> = ['telegram', 'enquiry', 'youtube'];
    private rotationInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        this.mobileForm = this.fb.group({
            mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]]
        });

        this.nameForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            investmentCapital: [''],
            acceptTerms: [false, Validators.requiredTrue]
        });

        this.otpForm = this.fb.group({
            otp: this.fb.array(Array(6).fill('').map(() =>
                this.fb.control('', [Validators.required, Validators.pattern(/^\d$/)])
            ))
        });

        this.enquiryForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
            email: ['', [Validators.required, Validators.email]],
            message: ['', [Validators.maxLength(300)]],
            investmentCapital: [''],
            acceptTerms: [false, Validators.requiredTrue]
        });
    }

    get otpDigits() {
        return this.otpForm.get('otp') as FormArray;
    }

    ngOnInit() {
        if (!this.isBrowser) return;
        // Restore state from sessionStorage if available
        const savedState = sessionStorage.getItem('leadState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);

                // If the saved step was OTP, check if it's still valid
                if (state.step === 'otp') {
                    const now = Date.now();
                    const expiresAt = state.expiresAt || 0;
                    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

                    if (remaining <= 0) {
                        // OTP Expired while page was closed/refreshed
                        sessionStorage.removeItem('leadState');
                        this.currentStep.set('mobile');
                        return;
                    }
                    this.startTimer(remaining);
                }

                if (state.mobile) this.mobileNumber.set(state.mobile);
                if (state.name) this.userName.set(state.name);
                if (state.youtubeLink) this.youtubeLink.set(state.youtubeLink);
                if (state.step) this.currentStep.set(state.step as Step);
                if (state.step === 'name' || state.step === 'otp') {
                    this.showStrategyModal.set(true);
                }

            } catch (e) {
                console.error('Failed to restore state', e);
                sessionStorage.removeItem('leadState');
            }
        }

        this.startTabRotation();
        this.destroyRef.onDestroy(() => this.stopTabRotation());

        this.startCountdown();
    }

    ngAfterViewInit(): void {
        if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
        const el = this.offerCardRef?.nativeElement;
        if (!el) return;
        if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

        this.offerObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    this.burstConfetti();
                    this.offerObserver?.disconnect();
                    this.offerObserver = null;
                    break;
                }
            }
        }, { threshold: 0.5 });
        this.offerObserver.observe(el);
        this.destroyRef.onDestroy(() => this.offerObserver?.disconnect());
    }

    /** Fire a confetti burst (guarded so rapid re-triggers don't stack). */
    burstConfetti(): void {
        if (typeof window === 'undefined' || this.showConfetti()) return;
        this.showConfetti.set(true);
        this.confettiTimer = setTimeout(() => this.showConfetti.set(false), 2600);
        this.destroyRef.onDestroy(() => { if (this.confettiTimer) clearTimeout(this.confettiTimer); });
    }

    /** Rolling weekly countdown — always ends the coming Sunday 23:59. */
    private startCountdown(): void {
        if (typeof window === 'undefined') return;
        const tick = () => {
            let diff = Math.max(0, this.nextDeadline().getTime() - Date.now());
            const d = Math.floor(diff / 86_400_000); diff -= d * 86_400_000;
            const h = Math.floor(diff / 3_600_000); diff -= h * 3_600_000;
            const m = Math.floor(diff / 60_000); diff -= m * 60_000;
            const s = Math.floor(diff / 1_000);
            this.countdown.set({ d: this.pad(d), h: this.pad(h), m: this.pad(m), s: this.pad(s) });
        };
        tick();
        this.countdownTimer = setInterval(tick, 1000);
        this.destroyRef.onDestroy(() => { if (this.countdownTimer) clearInterval(this.countdownTimer); });
    }

    private pad(n: number): string {
        return n < 10 ? '0' + n : '' + n;
    }

    private nextDeadline(): Date {
        const now = new Date();
        const d = new Date(now);
        const daysUntilSun = (7 - d.getDay()) % 7;
        d.setDate(d.getDate() + daysUntilSun);
        d.setHours(23, 59, 59, 999);
        if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
        return d;
    }

    selectTab(tab: 'telegram' | 'enquiry' | 'youtube') {
        this.activeFormTab.set(tab);
        this.stopTabRotation();
        this.startTabRotation();
    }

    onCardMouseEnter() {
        this.stopTabRotation();
    }

    onCardMouseLeave() {
        this.startTabRotation();
    }

    private startTabRotation() {
        // Always clear any existing interval first so we can never stack
        // multiple timers (which caused the tabs to rotate too fast).
        this.stopTabRotation();
        this.rotationInterval = setInterval(() => {
            const idx = this.TAB_ORDER.indexOf(this.activeFormTab());
            this.activeFormTab.set(this.TAB_ORDER[(idx + 1) % this.TAB_ORDER.length]);
        }, 3000);
    }

    private stopTabRotation() {
        if (this.rotationInterval !== null) {
            clearInterval(this.rotationInterval);
            this.rotationInterval = null;
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

    onEnquiryMobileNumberInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value.replace(/\D/g, '');
        input.value = value;
        this.enquiryForm.get('mobile')?.setValue(value, { emitEvent: false });
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

    // Go back to the mobile number entry step to correct the number
    goBackToMobile() {
        this.errorMessage.set('');
        this.mobileForm.get('mobile')?.setValue(this.mobileNumber(), { emitEvent: false });
        this.currentStep.set('mobile');
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
        const ic = this.nameForm.get('investmentCapital')?.value?.trim() || '';

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
            LeadSourceKey: 'Website Whatsapp Enquiry form ',
            Remarks: 'Unlock 3 Free Trade Ideas Flow',
            InvestmentCapital: ic,
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
        this.http.post(`${environment.apiurl}Leads/WebsiteLeads`, leadPayload)
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

                    // Track lead_submit event
                    if (typeof (window as any).gtag === 'function') {
                        (window as any).gtag('event', 'lead_submit', {
                            form_type: 'otp_verification',
                            page_location: window.location.href
                        });
                    }
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
        const expiresAt = Date.now() + (seconds * 1000);
        this.timer.set(seconds);
        this.canResend.set(false);

        this.saveStateWithExpiration(expiresAt);

        this.timerInterval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

            this.timer.set(remaining);

            if (remaining <= 0) {
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

    onEnquirySubmit() {
        if (this.enquiryForm.invalid) return;

        this.isEnquirySubmitting.set(true);
        this.enquirySuccess.set('');

        const formValue = this.enquiryForm.value;
        const now = new Date().toISOString();

        const payload: WebsiteLead = {
            Id: 0,
            PublicKey: this.generateGuid(),
            FullName: formValue.name,
            Gender: '',
            CountryCode: '+91',
            MobileNumber: formValue.mobile,
            AlternateMobileNumber: '',
            EmailId: formValue.email ?? '',
            ProfileImage: '',
            PriorityStatus: 'Normal',
            AssignedTo: '',
            ServiceKey: '',
            LeadTypeKey: '',
            LeadSourceKey: 'Website Enquiry',
            Remarks: formValue.message || '',
            InvestmentCapital: formValue.investmentCapital?.trim() || '',
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

        this.http.post(`${environment.apiurl}Leads/WebsiteLeads`, payload)
            .subscribe({
                next: () => {
                    this.isEnquirySubmitting.set(false);
                    this.enquirySuccess.set('Successfully Submitted! We will contact you soon.');
                    this.enquiryForm.reset();
                    setTimeout(() => this.enquirySuccess.set(''), 5000);
                },
                error: (err) => {
                    console.error('Enquiry submission failed', err);
                    this.isEnquirySubmitting.set(false);
                    this.errorMessage.set('Submission failed. Please try again.');
                    setTimeout(() => this.errorMessage.set(''), 5000);
                }
            });
    }
}
