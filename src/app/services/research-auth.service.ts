import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { finalize, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiEnvelope,
  AuthSession,
  OtpLoginData,
  OtpVerificationData,
} from '../models/research.models';

const SESSION_KEY = 'rm-web-research-session';

@Injectable({ providedIn: 'root' })
export class ResearchAuthService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sessionState = signal<AuthSession | null>(this.readSession());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.accessToken));

  sendOtp(mobileNumber: string) {
    const params = new HttpParams()
      .set('mobileNumber', mobileNumber)
      .set('countryCode', '+91');

    return this.http.get<ApiEnvelope<OtpLoginData>>(`${environment.gatewayUrl}auth/otp-login`, {
      params,
    });
  }

  verifyOtp(mobileUserKey: string, mobileNumber: string, otp: string) {
    return this.http
      .post<ApiEnvelope<OtpVerificationData>>(`${environment.gatewayUrl}auth/verify-otp`, {
        mobileUserKey,
        firebaseFcmToken: null,
        otp,
        deviceType: 'web',
        version: '1.0.0',
      })
      .pipe(
        tap((response) => this.storeSession(response, mobileNumber)),
      );
  }

  logout(): void {
    const session = this.sessionState();
    if (session) {
      this.http
        .post(`${environment.gatewayUrl}auth/logout`, {
          mobileUserKey: session.publicKey,
          fcmToken: null,
          refreshToken: session.refreshToken,
        }, { headers: { Authorization: `Bearer ${session.accessToken}` } })
        .pipe(finalize(() => this.clearSession()))
        .subscribe({ error: () => undefined });
      return;
    }
    this.clearSession();
  }

  private clearSession(): void {
    this.sessionState.set(null);
    if (this.isBrowser) sessionStorage.removeItem(SESSION_KEY);
  }

  private storeSession(response: ApiEnvelope<OtpVerificationData>, mobileNumber: string): void {
    if (response.statusCode !== 200 || !response.data?.accessToken) return;
    const session: AuthSession = {
      publicKey: response.data.publicKey,
      mobileNumber,
      name: response.data.name?.trim() || 'Investor',
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
    this.sessionState.set(session);
    if (this.isBrowser) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private readSession(): AuthSession | null {
    if (!this.isBrowser) return null;
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as AuthSession) : null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
