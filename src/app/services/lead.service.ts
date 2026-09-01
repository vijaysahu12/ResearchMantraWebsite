import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WebsiteLead {
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
    InvestmentCapital?: string;
    IsDisabled: number;
    IsDelete: number;
    CreatedOn: string;
    CreatedBy: string;
    IsSpam: number;
    IsWon: number;
    ModifiedOn: string;
    ModifiedBy: string;
    City: string;
    PinCode: string;
    StatusId: number;
    Favourite: boolean;
    PurchaseOrderKey: unknown;
}

export interface SendOtpRequest {
    mobileNumber: string;
    countryCode: string;
}

export interface VerifyOtpRequest {
    mobileNumber: string;
    otp: string;
}

export interface ApiResponse<T = unknown> {
    statusCode: number;
    message: string;
    data?: T;
}

@Injectable({
    providedIn: 'root'
})
export class LeadService {
    private http = inject(HttpClient);
    private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly CRM_API_URL = `${environment.apiurl}Leads`;

    // ─── Cookie key names ───────────────────────────────────────────────────────
    private readonly KEY_NAME   = 'rmLeadName';
    private readonly KEY_MOBILE = 'rmLeadMobile';
    /** Cookie lifetime in days — 365 days so the user is not asked again for a year */
    private readonly COOKIE_TTL_DAYS = 365;

    // ─── Public identity helpers ─────────────────────────────────────────────────

    /**
     * Returns true if we already have the visitor's name stored.
     * Checks cookie first, then falls back to localStorage so existing
     * users who filled the form before cookies were introduced are not asked again.
     */
    hasLeadData(): boolean {
        if (!this.isBrowser) return false;
        // Cookie is the source of truth; localStorage is only a fallback.
        return !!(this.readCookie(this.KEY_NAME) || this.readLocal(this.KEY_NAME));
    }

    /**
     * Returns the stored visitor name, or an empty string if not captured yet.
     * Checks the cookie first, then falls back to localStorage.
     */
    getLeadName(): string {
        if (!this.isBrowser) return '';
        return this.readCookie(this.KEY_NAME) || this.readLocal(this.KEY_NAME) || '';
    }

    /**
     * Returns the stored visitor mobile number, or an empty string if not captured yet.
     * Checks the cookie first, then falls back to localStorage.
     */
    getLeadMobile(): string {
        if (!this.isBrowser) return '';
        return this.readCookie(this.KEY_MOBILE) || this.readLocal(this.KEY_MOBILE) || '';
    }

    /**
     * Persists name + mobile in a 365-day cookie AND in localStorage as a backup.
     * Called by the lead-capture modal after a successful (or attempted) API save.
     */
    saveLeadData(name: string, mobile: string): void {
        if (!this.isBrowser) return;
        this.writeCookie(this.KEY_NAME,   name,   this.COOKIE_TTL_DAYS);
        this.writeCookie(this.KEY_MOBILE, mobile, this.COOKIE_TTL_DAYS);
        // localStorage backup — ensures the data survives if cookies are blocked
        this.writeLocal(this.KEY_NAME,   name);
        this.writeLocal(this.KEY_MOBILE, mobile);
    }

    // ─── CRM API calls ───────────────────────────────────────────────────────────

    sendOtp(data: SendOtpRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.CRM_API_URL}/send-otp`, data);
    }

    verifyOtp(data: VerifyOtpRequest): Observable<ApiResponse<{ youtubeLink: string }>> {
        return this.http.post<ApiResponse<{ youtubeLink: string }>>(`${this.CRM_API_URL}/verify-otp`, data);
    }

    submitWebsiteLead(name: string, mobile: string, source = 'Website Blog Read More'): Observable<ApiResponse> {
        const now = new Date().toISOString();
        const payload: WebsiteLead = {
            Id: 0,
            PublicKey: this.generateGuid(),
            FullName: name,
            Gender: '',
            CountryCode: '+91',
            MobileNumber: mobile,
            AlternateMobileNumber: '',
            EmailId: '',
            ProfileImage: '',
            PriorityStatus: 'Normal',
            AssignedTo: '',
            ServiceKey: '',
            LeadTypeKey: '',
            LeadSourceKey: source,
            Remarks: '',
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
        return this.http.post<ApiResponse>(`${this.CRM_API_URL}/WebsiteLeads`, payload);
    }

    private generateGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    // ─── Cookie utilities (private) ──────────────────────────────────────────────

    private writeCookie(name: string, value: string, days: number): void {
        if (!this.isBrowser) return;
        const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
        document.cookie =
            `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    private readCookie(name: string): string | null {
        if (!this.isBrowser) return null;
        const match = document.cookie.match(
            new RegExp('(?:^|;\\s*)' + name + '=([^;]*)')
        );
        return match ? decodeURIComponent(match[1]) : null;
    }

    // localStorage helpers wrapped so a disabled/throwing storage never breaks the cookie check.
    private readLocal(name: string): string | null {
        try {
            return localStorage.getItem(name);
        } catch {
            return null;
        }
    }

    private writeLocal(name: string, value: string): void {
        try {
            localStorage.setItem(name, value);
        } catch {
            /* storage blocked (private mode / quota) — cookie still holds the data */
        }
    }
}
