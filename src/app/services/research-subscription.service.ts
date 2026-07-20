import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiEnvelope,
  PaymentRequestResult,
  PaymentStatusResult,
  PurchaseHistoryItem,
  ResearchSubscriptionPlan,
  SubscriptionDuration,
} from '../models/research.models';
import { ResearchAuthService } from './research-auth.service';

const RESEARCH_PLAN_ID = 24;

@Injectable({ providedIn: 'root' })
export class ResearchSubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(ResearchAuthService);

  getPlans(productId: number): Observable<ResearchSubscriptionPlan[]> {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<ResearchSubscriptionPlan[]>>(
        `${environment.gatewayUrl}product/subscription/get-subscription-by-id`,
        {
          productId,
          subscriptionPlanId: RESEARCH_PLAN_ID,
          mobileUserKey: session.publicKey,
          deviceType: 'Web',
        },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  validateCoupon(productId: number, durationId: number, couponCode: string): Observable<{ deductedPrice: number }> {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<{ deductedPrice: number }>>(
        `${environment.gatewayUrl}product/subscription/validate-coupon`,
        {
          mobileUserKey: session.publicKey,
          productId,
          couponCode: couponCode.trim(),
          subscriptionDurationId: durationId,
        },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  createPaymentRequest(productId: number, duration: SubscriptionDuration, _amount: number, couponCode: string): Observable<PaymentRequestResult> {
    const session = this.requireSession();

    return this.http
      .post<PaymentRequestResult>(
        `${environment.gatewayUrl}payment/cashfree/orders`,
        {
          productIds: [productId],
          subscriptionMappingId: duration.subscriptionMappingId,
          couponCode: couponCode.trim().toUpperCase(),
        },
        { headers: this.authHeaders(session.accessToken) },
      );
  }

  getPaymentStatus(linkId: string): Observable<PaymentStatusResult> {
    const session = this.requireSession();
    return this.http
      .get<PaymentStatusResult>(
        `${environment.gatewayUrl}payment/cashfree/orders/${encodeURIComponent(linkId)}`,
        { headers: this.authHeaders(session.accessToken) },
      );
  }

  completeTestPayment(linkId: string): Observable<PaymentStatusResult> {
    const session = this.requireSession();
    return this.http.post<PaymentStatusResult>(
      `${environment.gatewayUrl}payment/cashfree/orders/${encodeURIComponent(linkId)}/test-complete`,
      {},
      { headers: this.authHeaders(session.accessToken) },
    );
  }

  getPurchaseHistory(): Observable<PurchaseHistoryItem[]> {
    const session = this.requireSession();
    return this.http.get<ApiEnvelope<PurchaseHistoryItem[]>>(`${environment.gatewayUrl}payment/history`, {
      headers: this.authHeaders(session.accessToken),
    }).pipe(map((response) => this.unwrap(response)));
  }

  getReceipt(id: number): Observable<PurchaseHistoryItem> {
    const session = this.requireSession();
    return this.http.get<ApiEnvelope<PurchaseHistoryItem>>(`${environment.gatewayUrl}payment/receipt/${id}`, {
      headers: this.authHeaders(session.accessToken),
    }).pipe(map((response) => this.unwrap(response)));
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
      throw new Error(response.message || 'The subscription request could not be completed.');
    }
    return response.data;
  }
}
