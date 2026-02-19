import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
    private fb = inject(FormBuilder);
    private http = inject(HttpClient);

    contactForm: FormGroup;
    isSubmitting = signal(false);
    submitSuccess = signal(false);
    submitError = signal(false);

    constructor() {
        this.contactForm = this.fb.group({
            fullName: ['', [Validators.required]],
            occupation: ['', [Validators.required]],
            phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
            email: ['', [Validators.required, Validators.email]],
            message: ['', [Validators.required]],
            acceptTerms: [false, Validators.requiredTrue]
        });
    }

    generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    onNameInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value.replace(/[^a-zA-Z\s]/g, '');
        input.value = value;
        this.contactForm.get('fullName')?.setValue(value, { emitEvent: false });
        input.setSelectionRange(start, end);
    }

    onMobileInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value.replace(/\D/g, '').slice(0, 10);
        input.value = value;
        this.contactForm.get('phoneNumber')?.setValue(value, { emitEvent: false });
        input.setSelectionRange(start, end);
    }

    onSubmit() {
        if (this.contactForm.valid) {
            this.isSubmitting.set(true);
            this.submitError.set(false);
            this.submitSuccess.set(false);

            const formValue = this.contactForm.value;
            const now = new Date().toISOString();

            const payload: WebsiteLead = {
                Id: 0,
                PublicKey: this.generateGuid(),
                FullName: formValue.fullName,
                Gender: '',
                CountryCode: '+91',
                MobileNumber: formValue.phoneNumber,
                AlternateMobileNumber: '',
                EmailId: formValue.email,
                ProfileImage: '',
                PriorityStatus: 'Normal',
                AssignedTo: '',
                ServiceKey: '',
                LeadTypeKey: '',
                LeadSourceKey: 'Website',
                Remarks: `Occupation: ${formValue.occupation}\nMessage: ${formValue.message}`,
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

            this.http.post('https://localhost:44380/api/Leads/WebsiteLeads', payload)
                .pipe(
                    finalize(() => this.isSubmitting.set(false))
                )
                .subscribe({
                    next: () => {
                        this.submitSuccess.set(true);
                        this.contactForm.reset();
                        // Reset success message after 5 seconds
                        setTimeout(() => this.submitSuccess.set(false), 5000);
                    },
                    error: (err) => {
                        console.error('Lead submission failed', err);
                        this.submitError.set(true);
                    }
                });
        } else {
            this.contactForm.markAllAsTouched();
        }
    }
}
