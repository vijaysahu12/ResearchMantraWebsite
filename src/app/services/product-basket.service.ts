import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiEnvelope, BasketOverview, BasketSummary, PaymentLinkResult } from '../models/research.models';
import { ResearchAuthService } from './research-auth.service';

/**
 * Dynamic Product Basket — binds to ProductBasketController (ProductService),
 * which is [AllowAnonymous] and already accepts an optional mobileUserKey to
 * fill in ownership/"already purchased" flags. GetActiveProductBaskets and
 * GetProductBasketOverview work logged out or in; InitiateBasketPurchase is
 * only ever called from the (guarded) Basket Overview page, so it always has
 * a session.
 */
@Injectable({ providedIn: 'root' })
export class ProductBasketService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(ResearchAuthService);

  /** Dashboard carousel — currently purchasable baskets only. */
  getActiveBaskets(): Observable<BasketSummary[]> {
    return this.http
      .get<ApiEnvelope<BasketSummary[]>>(`${environment.gatewayUrl}product/baskets/active`, {
        ...this.authOptions(),
        params: this.mobileUserKeyParams(),
      })
      .pipe(map((response) => response?.data ?? []));
  }

  /** Read-only "Basket Overview" — full breakdown, recomputed server-side. */
  getBasketOverview(id: string): Observable<BasketOverview> {
    return this.http
      .get<ApiEnvelope<BasketOverview>>(`${environment.gatewayUrl}product/baskets/${encodeURIComponent(id)}`, {
        ...this.authOptions(),
        params: this.mobileUserKeyParams(),
      })
      .pipe(map((response) => this.unwrap(response)));
  }

  /** Stages the purchase and returns a Cashfree payment link (same shape as the cart checkout). */
  initiateBasketPurchase(basketId: string, merchantTransactionId: string): Observable<PaymentLinkResult> {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<PaymentLinkResult>>(
        `${environment.gatewayUrl}product/baskets/purchase`,
        {
          basketId,
          mobileUserKey: session.publicKey,
          merchantTransactionId,
        },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  private mobileUserKeyParams(): HttpParams {
    const session = this.auth.session();
    return session ? new HttpParams().set('mobileUserKey', session.publicKey) : new HttpParams();
  }

  private requireSession() {
    const session = this.auth.session();
    if (!session) throw new Error('Please log in to continue.');
    return session;
  }

  /** Bearer header when a session exists, otherwise no auth header (anonymous). */
  private authOptions(): { headers?: HttpHeaders } {
    const session = this.auth.session();
    return session ? { headers: new HttpHeaders({ Authorization: `Bearer ${session.accessToken}` }) } : {};
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    if (response.statusCode !== 200 || response.data == null) {
      throw new Error(response.message || 'The basket request could not be completed.');
    }
    return response.data;
  }
}
