import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiEnvelope,
  CompaniesResponse,
  CompanyReport,
  SharedPost,
} from '../models/research.models';
import { ResearchAuthService } from './research-auth.service';

@Injectable({ providedIn: 'root' })
export class ResearchService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(ResearchAuthService);

  getCompanies(searchText = '') {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<CompaniesResponse>>(
        `${environment.gatewayUrl}product/research/companies`,
        {
          id: 18,
          loggedInUser: session.publicKey,
          searchText: searchText.trim() || null,
          primaryKey: null,
          secondaryKey: null,
          pageNumber: 1,
        },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  getCompanyReport(pageNumber: number) {
    const session = this.requireSession();
    return this.http
      .post<ApiEnvelope<CompanyReport>>(
        `${environment.gatewayUrl}product/research/company-report`,
        {
          id: 18,
          loggedInUser: session.publicKey,
          pageNumber,
          searchText: null,
          primaryKey: null,
          secondaryKey: null,
        },
        { headers: this.authHeaders(session.accessToken) },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  getSharedPost(postId: string) {
    const session = this.requireSession();
    return this.http.get<ApiEnvelope<SharedPost>>(
      `${environment.gatewayUrl}product/blog/shared/${encodeURIComponent(postId)}`,
      { headers: this.authHeaders(session.accessToken) },
    ).pipe(map((response) => this.unwrap(response)));
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
      throw new Error(response.message || 'We could not load the research right now.');
    }
    return response.data;
  }
}
