import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ResearchAuthService } from '../../services/research-auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-research-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './research-login.component.html',
  styleUrl: './research-login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchLoginComponent {
  private readonly auth = inject(ResearchAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal<'mobile' | 'otp'>('mobile');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly mobileUserKey = signal('');
  readonly localTestOtp = signal('');

  readonly mobile = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
  });
  readonly otp = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
  });

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
          this.localTestOtp.set(environment.production ? '' : response.data?.oneTimePassword || '');
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
      .verifyOtp(this.mobileUserKey(), this.mobile.value, this.otp.value)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (response.statusCode !== 200 || !response.data?.accessToken) {
            this.errorMessage.set(response.message || 'The OTP is incorrect. Please try again.');
            return;
          }
          const returnUrl = this.safeReturnUrl(
            this.route.snapshot.queryParamMap.get('returnUrl'),
          );
          void this.router.navigateByUrl(returnUrl);
        },
        error: () => this.errorMessage.set('The OTP could not be verified. Please try again.'),
      });
  }

  editMobile(): void {
    this.otp.reset();
    this.errorMessage.set('');
    this.localTestOtp.set('');
    this.step.set('mobile');
  }

  private safeReturnUrl(value: string | null): string {
    if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
      return '/research';
    }

    const allowed = ['/research', '/share/post/', '/share/research', '/admin/blogs'];
    return allowed.some((prefix) => value === prefix || value.startsWith(prefix))
      ? value
      : '/research';
  }
}
