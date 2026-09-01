import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiEnvelope, AppliedCouponInput, CartSummary, CartWithDurations } from '../models/research.models';
import { ResearchAuthService } from './research-auth.service';

@Injectable({ providedIn: 'root' })
export class ResearchCartService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(ResearchAuthService);

  /** Raw envelope (not unwrapped) — callers need to distinguish 200 (added) from 409 (already in cart). */
  addToCart(productMId: number): Observable<ApiEnvelope<number>> {
    const session = this.requireSession();
    return this.http.post<ApiEnvelope<number>>(
      `${environment.gatewayUrl}product/cart/add-to-cart`,
      { productMId },
      { headers: this.authHeaders(session.accessToken) },
    );
  }

  getCart(): Observable<CartSummary> {
    const session = this.requireSession();
    return this.http
      .get<ApiEnvelope<CartSummary>>(
        `${environment.gatewayUrl}product/cart/get-cart/${session.publicKey}`,
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  removeFromCart(id: number): Observable<void> {
    const session = this.requireSession();
    const params = new HttpParams().set('id', id);
    return this.http
      .delete<ApiEnvelope<null>>(`${environment.gatewayUrl}product/cart/remove-from-cart`, {
        headers: this.authHeaders(session.accessToken),
        params,
      })
      .pipe(map(() => undefined));
  }

  updateDuration(durationId: number): Observable<void> {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<null>>(
        `${environment.gatewayUrl}product/cart/update-duration`,
        { userPublicKey: session.publicKey, durationId },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map(() => undefined));
  }

  getCartWithDurations(appliedCoupons: AppliedCouponInput[]): Observable<CartWithDurations> {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<CartWithDurations>>(
        `${environment.gatewayUrl}product/subscription/v2/get-cart-with-durations`,
        { appliedCoupons },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  private requireSession() {
    const session = this.auth.session();
    if (!session) throw new Error('Please log in to continue.');
    return session;
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    if (response.statusCode !== 200 || response.data == null) {
      throw new Error(response.message || 'The cart request could not be completed.');
    }
    return response.data;
  }
}
