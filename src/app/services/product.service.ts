import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEnvelope, ProductDetail, ProductListItem, TopProduct } from '../models/research.models';
import { environment } from '../../environments/environment';
import { ResearchAuthService } from './research-auth.service';

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(ResearchAuthService);

  /** GET /gateway/product/GetTopProducts — public (sends token when available for ownership flags). */
  getTopProducts(): Observable<TopProduct[]> {
    return this.http
      .get<ApiEnvelope<TopProduct[]>>(`${environment.gatewayUrl}product/GetTopProducts`, this.authOptions())
      .pipe(map((response) => response?.data ?? []));
  }

  /**
   * Products list. When logged in we call the authenticated endpoint with the
   * user's publicKey + bearer token (so cart/bucket/ownership flags are filled
   * in). When logged out there is no token/userId, so we call the public
   * endpoint that returns only the basic display fields.
   */
  getProducts(searchByCategory = ''): Observable<ProductListItem[]> {
    const session = this.auth.session();
    let params = new HttpParams();
    if (searchByCategory.trim()) params = params.set('searchByCategory', searchByCategory.trim());

    const url = session
      ? `${environment.gatewayUrl}product/get-products/${encodeURIComponent(session.publicKey || EMPTY_GUID)}`
      : `${environment.gatewayUrl}product/get-public-products`;

    return this.http
      .get<ApiEnvelope<ProductListItem[]>>(url, { ...this.authOptions(), params })
      .pipe(map((response) => this.unwrap(response)));
  }

  /**
   * Single product details. Logged in → authenticated endpoint with the user's
   * publicKey + token (returns ownership/validity/cart state). Logged out →
   * public endpoint returning only the necessary display fields.
   */
  getProductById(id: number | string): Observable<ProductDetail> {
    const session = this.auth.session();

    let params = new HttpParams().set('id', String(id));
    let url = `${environment.gatewayUrl}product/get-public-product-by-id`;
    if (session) {
      params = params.set('mobileUserKey', session.publicKey || EMPTY_GUID);
      url = `${environment.gatewayUrl}product/get-product-by-id`;
    }

    return this.http
      .get<ApiEnvelope<ProductDetail>>(url, { ...this.authOptions(), params })
      .pipe(
        map((response) => {
          // The API camel-cases property names; the "ROI" acronym can arrive as "rOI".
          const data = this.unwrap(response) as ProductDetail & { rOI?: number };
          if (data.roi == null && data.rOI != null) data.roi = data.rOI;
          return data;
        }),
      );
  }

  /** Bearer header when a session exists, otherwise no auth header (anonymous). */
  private authOptions(): { headers?: HttpHeaders } {
    const session = this.auth.session();
    return session ? { headers: new HttpHeaders({ Authorization: `Bearer ${session.accessToken}` }) } : {};
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    if (response.statusCode !== 200 || response.data == null) {
      throw new Error(response.message || 'We could not load the products right now.');
    }
    return response.data;
  }
}
