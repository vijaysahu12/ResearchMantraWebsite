import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiEnvelope,
  GroupedPurchaseOrder,
  GroupedReceipt,
  MyBucketItem,
  PaymentLinkResult,
  PaymentRequestResult,
  PaymentStatusProduct,
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

  /** GetSubscriptionById for any product (subscriptionPlanId 0 => all durations of the product). */
  getProductSubscriptions(productId: number): Observable<ResearchSubscriptionPlan[]> {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<ResearchSubscriptionPlan[]>>(
        `${environment.gatewayUrl}product/subscription/get-subscription-by-id`,
        {
          productId,
          subscriptionPlanId: 0,
          mobileUserKey: session.publicKey,
          deviceType: 'Web',
        },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  /** AddPaymentRequestV2 — returns a payment link URL to open in a new tab. */
  addPaymentRequest(input: {
    productIds: number[];
    amount: number;
    couponCode: string;
    subscriptionDurationId: number;
    merchantTransactionId: string;
    customerName: string;
    customerEmail: string;
  }): Observable<PaymentLinkResult> {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<PaymentLinkResult>>(
        `${environment.gatewayUrl}Payment/AddPaymentRequest`,
        {
          productIds: input.productIds,
          merchantTransactionID: input.merchantTransactionId,
          amount: input.amount,
          couponCode: input.couponCode || '',
          subcriptionModelId: input.subscriptionDurationId,
          subscriptionMappingId: 0,
          mobileUserKey: session.publicKey,
          // Not yet read by the backend's AddPaymentRequest model — sent ahead
          // so the API can start persisting these once fields are added there.
          customerName: input.customerName,
          customerEmail: input.customerEmail,
        },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  /** GetPaymentStatusV2 — poll a payment by the merchant transaction id we generated. */
  getPaymentStatusV2(paymentRequestId: string): Observable<PaymentStatusProduct[]> {
    const session = this.requireSession();
    const params = new HttpParams().set('paymentRequestId', paymentRequestId);
    return this.http
      .post<ApiEnvelope<PaymentStatusProduct[]>>(
        `${environment.gatewayUrl}Payment/GetPaymentStatus`,
        null,
        { headers: this.authHeaders(session.accessToken), params },
      )
      .pipe(map((response) => response?.data ?? []));
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

  /**
   * One row per checkout transaction rather than per product — a multi-product "buy all" order
   * writes one purchase-order row per product, each carrying the full order total. This groups
   * them back into one order so the amount shown isn't repeated N times.
   */
  getGroupedPurchaseHistory(): Observable<GroupedPurchaseOrder[]> {
    const session = this.requireSession();
    return this.http.get<ApiEnvelope<GroupedPurchaseOrder[]>>(`${environment.gatewayUrl}payment/grouped-history`, {
      headers: this.authHeaders(session.accessToken),
    }).pipe(map((response) => this.unwrap(response)));
  }

  getGroupedReceipt(transactionId: string): Observable<GroupedReceipt> {
    const session = this.requireSession();
    return this.http
      .get<ApiEnvelope<GroupedReceipt>>(`${environment.gatewayUrl}payment/grouped-receipt/${encodeURIComponent(transactionId)}`, {
        headers: this.authHeaders(session.accessToken),
      })
      .pipe(map((response) => this.unwrap(response)));
  }

  getMyBucket(): Observable<MyBucketItem[]> {
    const session = this.requireSession();
    return this.http.get<ApiEnvelope<MyBucketItem[]>>(`${environment.gatewayUrl}product/my-bucket-content`, {
      headers: this.authHeaders(session.accessToken),
    }).pipe(map((response) => {
      if (response.statusCode !== 200) throw new Error(response.message || 'My Bucket could not be loaded.');
      return response.data ?? [];
    }));
  }

  getReceipt(id: number): Observable<PurchaseHistoryItem> {
    const session = this.requireSession();
    return this.http.get<ApiEnvelope<PurchaseHistoryItem>>(`${environment.gatewayUrl}payment/receipt/${id}`, {
      headers: this.authHeaders(session.accessToken),
    }).pipe(map((response) => this.unwrap(response)));
  }

  newMerchantTransactionId(): string {
    const now = new Date();
    const pad = (value: number, length = 2) => value.toString().padStart(length, '0');
    const stamp =
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
    return `RMWEB-${stamp}`;
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
