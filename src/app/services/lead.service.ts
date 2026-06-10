import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    private readonly CRM_API_URL = 'https://crmapi.researchmantra.in/api/Leads';

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
        return !!(this.readCookie(this.KEY_NAME) || localStorage.getItem(this.KEY_NAME));
    }

    /**
     * Returns the stored visitor name, or an empty string if not captured yet.
     */
    getLeadName(): string {
        return this.readCookie(this.KEY_NAME) || localStorage.getItem(this.KEY_NAME) || '';
    }

    /**
     * Persists name + mobile in a 365-day cookie AND in localStorage as a backup.
     * Called by the lead-capture modal after a successful (or attempted) API save.
     */
    saveLeadData(name: string, mobile: string): void {
        this.writeCookie(this.KEY_NAME,   name,   this.COOKIE_TTL_DAYS);
        this.writeCookie(this.KEY_MOBILE, mobile, this.COOKIE_TTL_DAYS);
        // localStorage backup — ensures the data survives if cookies are blocked
        localStorage.setItem(this.KEY_NAME,   name);
        localStorage.setItem(this.KEY_MOBILE, mobile);
    }

    // ─── CRM API calls ───────────────────────────────────────────────────────────

    sendOtp(data: SendOtpRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.CRM_API_URL}/send-otp`, data);
    }

    verifyOtp(data: VerifyOtpRequest): Observable<ApiResponse<{ youtubeLink: string }>> {
        return this.http.post<ApiResponse<{ youtubeLink: string }>>(`${this.CRM_API_URL}/verify-otp`, data);
    }

    submitWebsiteLead(name: string, mobile: string): Observable<ApiResponse> {
        const payload = { FullName: name, MobileNumber: mobile, CountryCode: '+91' };
        return this.http.post<ApiResponse>(`${this.CRM_API_URL}/WebsiteLeads`, payload);
    }

    // ─── Cookie utilities (private) ──────────────────────────────────────────────

    private writeCookie(name: string, value: string, days: number): void {
        const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
        document.cookie =
            `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    private readCookie(name: string): string | null {
        const match = document.cookie.match(
            new RegExp('(?:^|;\\s*)' + name + '=([^;]*)')
        );
        return match ? decodeURIComponent(match[1]) : null;
    }
}
