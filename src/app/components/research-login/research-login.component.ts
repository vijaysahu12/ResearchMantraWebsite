import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ResearchAuthService } from '../../services/research-auth.service';
import { FreeTrialService } from '../../services/free-trial.service';

@Component({
  selector: 'app-research-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './research-login.component.html',
  styleUrl: './research-login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchLoginComponent {
  private readonly auth = inject(ResearchAuthService);
  private readonly freeTrial = inject(FreeTrialService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<'mobile' | 'otp'>('mobile');
  /** UI-only: drives the slide direction of the step transition. */
  readonly direction = signal<'forward' | 'back'>('forward');
  /** UI-only: enables the swap animation only after the first step change. */
  readonly hasInteracted = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly mobileUserKey = signal('');

  readonly mobile = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
  });
  readonly otp = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
  });
  readonly whatsappOptIn = new FormControl(true, { nonNullable: true });

  private readonly mobileInput = viewChild<ElementRef<HTMLInputElement>>('mobileInput');
  private readonly otpInput = viewChild<ElementRef<HTMLInputElement>>('otpInput');

  constructor() {
    // Auto-focus (and select any existing value in) whichever step's input is showing,
    // both on first load and after switching steps.
    afterRenderEffect(() => {
      const target = this.step() === 'mobile' ? this.mobileInput() : this.otpInput();
      target?.nativeElement.focus();
      target?.nativeElement.select();
    });
  }

  /** Strips anything but digits as the user types (paste included), independent of form validation. */
  onNumericInput(event: Event, control: FormControl<string>, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, maxLength);
    if (digitsOnly !== input.value) input.value = digitsOnly;
    control.setValue(digitsOnly);
  }

  sendOtp(): void {
    this.mobile.markAsTouched();
    if (this.mobile.invalid || this.isLoading()) return;

    this.errorMessage.set('');
    this.isLoading.set(true);
    this.auth
      .sendOtp(this.mobile.value)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          const publicKey = response.data?.publicKey;
          const result = response.data?.result?.toUpperCase();
          if (!publicKey || (result !== 'OTPSENT' && result !== 'REGISTERED')) {
            this.errorMessage.set(response.message || 'We could not send the OTP. Please try again.');
            return;
          }
          this.mobileUserKey.set(publicKey);
          this.direction.set('forward');
          this.hasInteracted.set(true);
          this.step.set('otp');
        },
        error: () => this.errorMessage.set('Unable to reach the login service. Please try again.'),
      });
  }

  verifyOtp(): void {
    this.otp.markAsTouched();
    if (this.otp.invalid || this.isLoading()) return;

    this.errorMessage.set('');
    this.isLoading.set(true);
    this.auth
      .verifyOtp(this.mobileUserKey(), this.mobile.value, this.otp.value, this.whatsappOptIn.value)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.statusCode !== 200 || !response.data?.accessToken) {
            this.errorMessage.set(response.message || 'The OTP is incorrect. Please try again.');
            return;
          }
          this.freeTrial.checkAndMaybeShow(response.data.publicKey);
          // A saved product redirect (e.g. from a "Buy" click while logged out)
          // takes priority; it is cleared on read so later logins won't reuse it.
          const saved = this.auth.consumePostLoginRedirect();
          const target =
            saved && this.isSafeInternalUrl(saved)
              ? saved
              : this.safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
          void this.router.navigateByUrl(target);
        },
        error: () => this.errorMessage.set('The OTP could not be verified. Please try again.'),
      });
  }

  /**
   * User is leaving the login flow (e.g. "Back to home"). Drop any saved
   * post-login redirect so signing in later from elsewhere doesn't send them
   * back to a product they abandoned here.
   */
  onBackToHome(): void {
    this.auth.clearPostLoginRedirect();
  }

  editMobile(): void {
    this.otp.reset();
    this.errorMessage.set('');
    this.direction.set('back');
    this.hasInteracted.set(true);
    this.step.set('mobile');
  }

  private isSafeInternalUrl(value: string): boolean {
    return (
      (value.startsWith('/research/products/') || value.startsWith('/research/basket/')) &&
      !value.startsWith('//') &&
      !value.includes('\\')
    );
  }

  private safeReturnUrl(value: string | null): string {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
      return '/research';
    }

    const allowed = ['/research', '/research/cart', '/research/basket', '/share/post/', '/share/research', '/admin/blogs'];
    return allowed.some((prefix) => value === prefix || value.startsWith(prefix))
      ? value
      : '/research';
  }
}
