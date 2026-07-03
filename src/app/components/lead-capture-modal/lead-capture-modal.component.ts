import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LeadService } from '../../services/lead.service';

@Component({
  selector: 'app-lead-capture-modal',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
      (click)="onOverlayClick($event)"
    >
      <div class="modal-card">
        <button class="close-btn" type="button" (click)="close()" aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="modal-header">
          <div class="header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <h2 id="lead-modal-title" class="modal-title">Unlock This Article</h2>
          <p class="modal-subtitle">
            Enter your details to read the full article and join the discussion with your name.
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="modal-form">
          <div class="form-group">
            <label for="lead-name" class="form-label">Full Name <span class="required" aria-hidden="true">*</span></label>
            <input
              id="lead-name"
              type="text"
              formControlName="name"
              maxlength="50"
              class="form-input"
              [class.input-error]="form.get('name')?.invalid && form.get('name')?.touched"
              placeholder="e.g. Rajesh Kumar"
              autocomplete="name"
            />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <span class="error-msg" role="alert">Please enter your full name (min. 2 characters)</span>
            }
          </div>

          <div class="form-group">
            <label for="lead-mobile" class="form-label">Mobile Number <span class="required" aria-hidden="true">*</span></label>
            <div class="phone-wrapper">
              <span class="country-code" aria-label="Country code India">+91</span>
              <input
                id="lead-mobile"
                type="tel"
                formControlName="mobile"
                class="form-input phone-input"
                [class.input-error]="form.get('mobile')?.invalid && form.get('mobile')?.touched"
                placeholder="9876543210"
                maxlength="10"
                autocomplete="tel-national"
              />
            </div>
            @if (form.get('mobile')?.invalid && form.get('mobile')?.touched) {
              <span class="error-msg" role="alert">Enter a valid 10-digit Indian mobile number</span>
            }
          </div>

          @if (apiError()) {
            <div class="api-error" role="alert">{{ apiError() }}</div>
          }

          <button type="submit" class="submit-btn" [disabled]="isSubmitting()">
            @if (isSubmitting()) {
              <span class="btn-spinner" aria-hidden="true"></span>
              Processing...
            } @else {
              Read Full Article
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            }
          </button>
        </form>

        <p class="privacy-note">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Your information is 100% safe. We never share your data.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 48px 40px 36px;
      width: 100%;
      max-width: 460px;
      position: relative;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.35);
      animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: rotate(90deg);
    }

    .modal-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .header-icon {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: #ffffff;
      box-shadow: 0 8px 20px -4px rgba(30, 58, 138, 0.4);
    }

    .modal-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px;
      letter-spacing: -0.02em;
    }

    .modal-subtitle {
      font-size: 15px;
      color: #64748b;
      margin: 0;
      line-height: 1.6;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .required {
      color: #ef4444;
      margin-left: 2px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 15px;
      font-family: inherit;
      color: #0f172a;
      background: #f8fafc;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #1e3a8a;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.08);
    }

    .form-input.input-error {
      border-color: #ef4444;
      background: #fff5f5;
    }

    .form-input.input-error:focus {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
    }

    .phone-wrapper {
      display: flex;
      align-items: center;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
      overflow: hidden;
      transition: all 0.2s;
    }

    .phone-wrapper:focus-within {
      border-color: #1e3a8a;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.08);
    }

    .country-code {
      padding: 12px 12px 12px 16px;
      font-size: 15px;
      font-weight: 600;
      color: #374151;
      border-right: 1.5px solid #e2e8f0;
      white-space: nowrap;
      background: transparent;
      flex-shrink: 0;
    }

    .phone-input {
      border: none;
      border-radius: 0;
      background: transparent;
      flex: 1;
      padding: 12px 16px;
    }

    .phone-input:focus {
      outline: none;
      box-shadow: none;
      border: none;
    }

    .error-msg {
      font-size: 13px;
      color: #ef4444;
      font-weight: 500;
    }

    .api-error {
      padding: 12px 16px;
      background: #fff5f5;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-size: 14px;
      color: #dc2626;
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 28px;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 14px -2px rgba(30, 58, 138, 0.45);
      margin-top: 4px;
    }

    .submit-btn:not([disabled]):hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -4px rgba(30, 58, 138, 0.5);
    }

    .submit-btn:not([disabled]):active {
      transform: translateY(0);
    }

    .submit-btn[disabled] {
      background: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }

    .btn-spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255, 255, 255, 0.35);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .privacy-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 12px;
      color: #94a3b8;
      margin: 20px 0 0;
      text-align: center;
    }

    @media (max-width: 480px) {
      .modal-card {
        padding: 40px 24px 28px;
        border-radius: 20px;
      }

      .modal-title {
        font-size: 21px;
      }
    }
  `],
})
export class LeadCaptureModalComponent {
  readonly submitted = output<{ name: string; mobile: string }>();
  readonly closed = output<void>();

  private fb = inject(FormBuilder);
  private leadService = inject(LeadService);

  isSubmitting = signal(false);
  apiError = signal('');

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
  });

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.close();
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.value.name!.trim();
    const mobile = this.form.value.mobile!.trim();

    this.isSubmitting.set(true);
    this.apiError.set('');

    this.leadService.submitWebsiteLead(name, mobile).subscribe({
      next: () => {
        this.persistAndEmit(name, mobile);
      },
      error: () => {
        // Still proceed — lead capture shouldn't block reading
        this.persistAndEmit(name, mobile);
      },
    });
  }

  private persistAndEmit(name: string, mobile: string) {
    // Save via service — writes a 365-day cookie + localStorage backup
    this.leadService.saveLeadData(name, mobile);
    this.isSubmitting.set(false);
    this.submitted.emit({ name, mobile });
  }

  close() {
    this.closed.emit();
  }
}
