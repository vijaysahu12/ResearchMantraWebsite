import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
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

/**
 * Turn a failed payment call into something a customer can act on and a
 * developer can diagnose.
 *
 * HttpErrorResponse is NOT an `instanceof Error`, so a plain
 * `error instanceof Error ? error.message : 'generic'` check discards the status
 * code and the gateway's own message — an expired session, a missing endpoint
 * and an unconfigured gateway all render as the same sentence with nothing to
 * tell them apart. The status code is kept in the text so it is visible in a
 * screenshot or a support ticket.
 */
export function describePaymentError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body: any = error.error;
    const serverMessage: string =
      (typeof body === 'string' ? body.trim() : '') ||
      body?.message ||
      body?.Message ||
      body?.detail ||
      body?.title ||
      '';

    if (error.status === 0) {
      return 'The payment service could not be reached. Check your internet connection and try again.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Your session has expired. Please sign in again to continue.';
    }
    if (error.status === 404) {
      return `The payment service is unavailable right now (404). ${serverMessage}`.trim();
    }
    if (serverMessage) {
      return `${serverMessage} (${error.status})`;
    }
    return `${fallback} (HTTP ${error.status})`;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

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
