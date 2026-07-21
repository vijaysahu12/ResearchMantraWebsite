import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ResearchSubscriptionService } from './research-subscription.service';
import { ResearchAuthService } from './research-auth.service';

describe('ResearchSubscriptionService payment security', () => {
  let service: ResearchSubscriptionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: ResearchAuthService, useValue: { session: () => ({ publicKey: 'user-key', accessToken: 'jwt' }) } },
      ],
    });
    service = TestBed.inject(ResearchSubscriptionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('does not send client-controlled identity or amount to Cashfree order creation', () => {
    service.createPaymentRequest(155, {
      subscriptionDurationId: 3, subscriptionDurationName: '3 months', months: 3,
      discountPrice: 0, netPayment: 1200, actualPrice: 1200, subscriptionMappingId: 42,
    }, 1, 'SAVE').subscribe();

    const request = http.expectOne((r) => r.url.endsWith('/payment/cashfree/orders'));
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt');
    expect(request.request.body).toEqual({ productIds: [155], subscriptionMappingId: 42, couponCode: 'SAVE' });
    expect(request.request.body.mobileUserKey).toBeUndefined();
    expect(request.request.body.amount).toBeUndefined();
    request.flush({ link_id: 'link-1', link_url: 'https://payments.example/link-1' });
  });

  it('requests only the signed-in user purchase history', () => {
    service.getPurchaseHistory().subscribe();
    const request = http.expectOne((r) => r.url.endsWith('/payment/history'));
    expect(request.request.params.keys()).toEqual([]);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt');
    request.flush({ statusCode: 200, message: 'ok', data: [] });
  });
});
