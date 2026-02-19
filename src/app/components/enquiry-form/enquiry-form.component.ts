import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

interface WebsiteLead {
  Id: number;
  PublicKey: string;
  FullName: string;
  Gender: string;
  CountryCode: string;
  MobileNumber: string;
  AlternateMobileNumber: string;
  EmailId: string;
  ProfileImage: string;
  PriorityStatus: string;
  AssignedTo: string;
  ServiceKey: string;
  LeadTypeKey: string;
  LeadSourceKey: string;
  Remarks: string;
  IsDisabled: number | null;
  IsDelete: number | null;
  CreatedOn: string | null;
  CreatedBy: string;
  IsSpam: number | null;
  IsWon: number | null;
  ModifiedOn: string;
  ModifiedBy: string;
  City: string;
  PinCode: string;
  StatusId: number | null;
  Favourite: boolean | null;
  PurchaseOrderKey: string | null;
}

@Component({
  selector: 'app-enquiry-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Floating Button -->
    <button class="floating-btn" (click)="toggleEnquiry()" aria-label="Enquire Now">
      <span class="btn-text">Get Expert Advice</span>
      <span class="btn-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </span>
    </button>

    <!-- Overlay & Panel -->
    @if (isOpen()) {
      <div class="enquiry-overlay" (click)="toggleEnquiry()"></div>
      <div class="enquiry-panel" [class.open]="isOpen()">
        <div class="panel-header">
          <h3>Get Expert Advice</h3>
          <button class="close-btn" (click)="toggleEnquiry()" aria-label="Close">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        

        <form [formGroup]="enquiryForm" (ngSubmit)="onSubmit()" class="panel-body">
          <div class="form-group">
            <label for="name">Full Name*</label>
            <input type="text" id="name" formControlName="name" placeholder="Enter your name"
                   (input)="onNameInput($event)" [class.error]="isFieldInvalid('name')">
          </div>

          <div class="form-group">
            <label for="mobile">Mobile Number*</label>
            <input type="tel" id="mobile" formControlName="mobile" maxlength="10" placeholder="Enter your mobile number"
                   (input)="onMobileInput($event)" [class.error]="isFieldInvalid('mobile')">
          </div>

          <div class="form-group">
            <label for="email">Email Address*</label>
            <input type="email" id="email" formControlName="email" placeholder="example@email.com"
                   [class.error]="isFieldInvalid('email')">
          </div>

          <div class="form-group">
            <label for="message">Your Message</label>
            <textarea id="message" formControlName="message" rows="4" placeholder="How can we help you?"></textarea>
          </div>

          <div class="terms-wrapper">
            <label class="checkbox-container">
              <input type="checkbox" formControlName="acceptTerms">
              <span class="checkmark"></span>
              <span class="terms-text">
                I accept the <a href="https://researchmantra.in/terms-conditions" target="_blank" (click)="$event.stopPropagation()">Terms & Conditions</a>
              </span>
            </label>
          </div>

          <button type="submit" class="submit-btn" [disabled]="enquiryForm.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Sending...' : 'Contact Now' }}
          </button>

          @if (successMessage()) {
            <div class="success-alert">{{ successMessage() }}</div>
          }
        </form>
      </div>
    }
  `,
  styles: [`
    .floating-btn {
      position: fixed;
      right: -45px;
      top: 35%;
      transform: translateY(-50%) rotate(-90deg);
      z-index: 1000;
      background: #111827;
      color: #FACC15;
      border: none;
      padding: 12px 24px;
      border-radius: 8px 8px 0 0;
      font-weight: 700;
      font-size: 14px;
      font-family: "Inter", system-ui, sans-serif;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: -2px 0 15px rgba(0,0,0,0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .floating-btn:hover {
      right: -40px;
      background: #000;
    }

    .btn-icon {
      transform: rotate(90deg);
      display: flex;
    }

    .enquiry-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: 1001;
      animation: fadeIn 0.3s ease;
    }

    .enquiry-panel {
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      width: 100%;
      max-width: 400px;
      background: #fff;
      z-index: 1002;
      box-shadow: -10px 0 30px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      font-family: "Inter", system-ui, sans-serif;
      animation: slideIn 0.3s cubic-bezier(0, 0, 0.2, 1);
    }

    .panel-header {
      padding: 24px;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #111827;
      color: #fff;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #FACC15;
    }

    .close-btn {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 4px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .close-btn:hover {
      opacity: 1;
    }

    .panel-body {
      padding: 32px;
      flex: 1;
      overflow-y: auto;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      font-size: 15px;
      transition: all 0.2s;
      font-family: inherit;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #111827;
      box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05);
    }

    .form-group input.error {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .submit-btn {
      width: 100%;
      background: #111827;
      color: #fff;
      padding: 14px;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 10px;
    }

    .submit-btn:hover:not(:disabled) {
      background: #000;
      transform: translateY(-1px);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .success-alert {
      margin-top: 20px;
      padding: 12px;
      background: #ecfdf5;
      color: #065f46;
      border-radius: 8px;
      font-size: 14px;
      text-align: center;
      border: 1px solid #a7f3d0;
    }

    /* Terms Checkbox Styling */
    .terms-wrapper {
      margin-bottom: 20px;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      position: relative;
      padding-left: 28px;
      cursor: pointer;
      font-size: 13px;
      user-select: none;
      color: #4B5563;
    }

    .checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      height: 18px;
      width: 18px;
      background-color: #f9fafb;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .checkbox-container:hover input ~ .checkmark {
      border-color: #111827;
    }

    .checkbox-container input:checked ~ .checkmark {
      background-color: #111827;
      border-color: #111827;
    }

    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
    }

    .checkbox-container input:checked ~ .checkmark:after {
      display: block;
    }

    .checkbox-container .checkmark:after {
      left: 5.5px;
      top: 2px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .terms-text a {
      color: #111827;
      text-decoration: underline;
      font-weight: 600;
      text-underline-offset: 2px;
    }

    .terms-text a:hover {
      color: #000;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @media (max-width: 480px) {
      .enquiry-panel {
        max-width: 100%;
      }
      .floating-btn {
        right: -48px;
        padding: 10px 20px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnquiryFormComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  isOpen = signal(false);
  isSubmitting = signal(false);
  successMessage = signal('');

  enquiryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    email: ['', [Validators.required, Validators.email]],
    message: [''],
    acceptTerms: [false, Validators.requiredTrue]
  });

  onNameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value.replace(/[^a-zA-Z\s]/g, '');
    input.value = value;
    this.enquiryForm.get('name')?.setValue(value, { emitEvent: false });
    input.setSelectionRange(start, end);
  }

  onMobileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = value;
    this.enquiryForm.get('mobile')?.setValue(value, { emitEvent: false });
    input.setSelectionRange(start, end);
  }

  generateGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  toggleEnquiry() {
    this.isOpen.set(!this.isOpen());
    if (!this.isOpen()) {
      this.successMessage.set('');
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.enquiryForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.enquiryForm.valid) {
      this.isSubmitting.set(true);

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
        EmailId: formValue.email,
        ProfileImage: '',
        PriorityStatus: 'Normal',
        AssignedTo: '',
        ServiceKey: '',
        LeadTypeKey: '',
        LeadSourceKey: 'Website Enquiry',
        Remarks: formValue.message,
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

      this.http.post('https://crmapi.researchmantra.in/api/Leads/WebsiteLeads', payload)
        .pipe(
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe({
          next: () => {
            this.successMessage.set('Thank you! Our expert will contact you shortly.');
            this.enquiryForm.reset();

            // Close panel after delay
            setTimeout(() => {
              this.isOpen.set(false);
              this.successMessage.set('');
            }, 3000);
          },
          error: (err) => {
            console.error('Lead submission failed', err);
            this.successMessage.set('Oops! Something went wrong. Please try again.');
          }
        });
    }
  }
}
