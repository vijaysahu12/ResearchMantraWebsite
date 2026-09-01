import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { finalize, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiEnvelope,
  AuthSession,
  OtpLoginData,
  OtpVerificationData,
  UserBasicDetails,
} from '../models/research.models';

const SESSION_KEY = 'rm-web-research-session';
const POST_LOGIN_REDIRECT_KEY = 'rm-post-login-redirect';

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

  verifyOtp(mobileUserKey: string, mobileNumber: string, otp: string, whatsappOptIn = true) {
    return this.http
      .post<ApiEnvelope<OtpVerificationData>>(`${environment.gatewayUrl}auth/verify-otp`, {
        mobileUserKey,
        firebaseFcmToken: null,
        otp,
        deviceType: 'web',
        version: '1.0.0',
        // Not yet read by the backend's verify-otp model — sent ahead so the
        // API can start persisting it once a field is added there.
        whatsappOptIn,
      })
      .pipe(
        tap((response) => this.storeSession(response, mobileNumber)),
      );
  }

  /** The logged-in user's profile (email, DOB, etc.) — none of this is returned by the login/OTP APIs. */
  getUserBasicDetails(): Observable<UserBasicDetails | null> {
    const session = this.sessionState();
    if (!session) return of(null);

    const params = new HttpParams().set('userId', session.publicKey);
    return this.http
      .get<ApiEnvelope<UserBasicDetails>>(`${environment.gatewayUrl}auth/user-basic-details`, {
        params,
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
      .pipe(map((response) => response.data ?? null));
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

  /** Remember where to send the user after they log in (e.g. a product they wanted to buy). */
  setPostLoginRedirect(url: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(POST_LOGIN_REDIRECT_KEY, url);
    } catch {
      /* storage unavailable — ignore */
    }
  }

  /**
   * Forget any saved post-login redirect. Called when the user abandons the
   * login flow (e.g. "Back to home") so a later, unrelated login does not
   * bounce them to a product page they clicked "Buy" on much earlier.
   */
  clearPostLoginRedirect(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    } catch {
      /* storage unavailable — ignore */
    }
  }

  /** Read the saved redirect and clear it immediately so it is only used once. */
  consumePostLoginRedirect(): string | null {
    if (!this.isBrowser) return null;
    try {
      const url = localStorage.getItem(POST_LOGIN_REDIRECT_KEY);
      if (url) localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      return url;
    } catch {
      return null;
    }
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
