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
    // private readonly OTP_API_URL = 'https://localhost:44380/api/Leads';

    sendOtp(data: SendOtpRequest): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.CRM_API_URL}/send-otp`, data);
    }

    verifyOtp(data: VerifyOtpRequest): Observable<ApiResponse<{ youtubeLink: string }>> {
        return this.http.post<ApiResponse<{ youtubeLink: string }>>(`${this.CRM_API_URL}/verify-otp`, data);
    }
}
