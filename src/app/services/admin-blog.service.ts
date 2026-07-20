import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResearchAuthService } from './research-auth.service';

export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content?: string;
    category: string;
    date: string;
    author: string;
    readTime: string;
    image: string;
    images: WebsiteBlogImage[];
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    likesCount?: number;
    commentsCount?: number;
    isLiked?: boolean;
    comments?: unknown[];
    enableComments?: boolean;
}

export interface WebsiteBlogImage {
  url: string;
  alt?: string;
  aspectRatio?: string;
}

export interface ApiEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
  total?: number;
}

export interface BlogEditorPayload {
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  hashtag: string;
  category: string;
  investmentCapital: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  enableComments: boolean;
  isPinned: boolean;
  isPublished: boolean;
  publishedOn: string;
  image?: File;
}

@Injectable({
    providedIn: 'root'
})
export class AdminBlogService {

    private readonly apiUrl = `${environment.apiurl}WebsiteBlog`;
    private readonly http = inject(HttpClient);
    private readonly auth = inject(ResearchAuthService);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    private processBlogContent(content: string): string {
        if (!content) return '';

        let hasSebiLink = false;
        const sebiDomain = 'sebi.gov.in';

        // Process all anchor tags
        return content.replace(/<a\s+([^>]*?)>(.*?)<\/a>/gi, (match, attributes, linkText) => {
            const hrefMatch = attributes.match(/href=["'](.*?)["']/);
            if (!hrefMatch) return match;

            const href = hrefMatch[1];
            const isExternal = href.startsWith('http');
            const isSebi = href.includes(sebiDomain);

            if (isSebi) {
                if (!hasSebiLink) {
                    hasSebiLink = true;
                    // First SEBI link: ensure it opens in a new tab
                    return `<a href="${href}" target="_blank">${linkText}</a>`;
                } else {
                    // Subsequent SEBI links: convert to plain text
                    return linkText;
                }
            }

            if (isExternal) {
                // Other external links: open in new tab
                return `<a href="${href}" target="_blank">${linkText}</a>`;
            } else {
                // Internal links: open in same tab
                return `<a href="${href}">${linkText}</a>`;
            }
        });
    }
private blogs = signal<BlogPost[]>([]);
    // getBlogs() {
    //     return this.blogsData;
    // }

    // getBlogBySlug(slug: string) {
    //     return this.blogsData().find(blog => blog.slug === slug);
    // }

//     getBlogBySlug(slug: string) {
//   return this.blogs().find(blog => blog.slug === slug);
// }

loadBlogs(page = 1, size = 50, search = ''): void {
  this.getPublishedBlogs(page, size, search).subscribe({
    next: (res) => {
      const mappedData = (res?.data ?? []).map((b) => ({
        ...b,
        images: b.images ?? [],
        enableComments: b.enableComments === true || String(b.enableComments).toLowerCase() === 'true'
      }));
      this.blogs.set(mappedData);
    },
    error: (err) => {
      console.error('❌ [Service] API Error:', err);
      this.blogs.set([]);
    }
  });
}

  getPublishedBlogs(page = 1, size = 50, search = ''): Observable<ApiEnvelope<BlogPost[]>> {
    const params = new HttpParams()
      .set('pageNumber', page)
      .set('pageSize', size)
      .set('search', search);
    return this.http.get<ApiEnvelope<BlogPost[]>>(`${this.apiUrl}/GetAllWebsiteBlogs`, {
      params,
      headers: this.publicHeaders(),
    });
  }

   getBlogs() {
    return this.blogs; // returning signal
  }

getBlogDetails(slug: string): Observable<ApiEnvelope<BlogPost>> {
  return this.http.get<ApiEnvelope<BlogPost>>(
    `${this.apiUrl}/GetBlogBySlug/${encodeURIComponent(slug)}`,
    { headers: this.publicHeaders() },
  );
}

  addComment(payload: any) {
    return this.http.post(`${this.apiUrl}/AddComment`, payload);
  }

  getComments(blogId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/${blogId}/comments`, { headers: this.publicHeaders() });
}

toggleLike(blogId: string, userId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/${blogId}/like`, { userId });
}

  savePost(payload: BlogEditorPayload): Observable<ApiEnvelope<BlogPost>> {
    const formData = new FormData();
    const fields: Record<string, string> = {
      Title: payload.title,
      Slug: payload.slug,
      ShortDescription: payload.shortDescription,
      Content: payload.content,
      Hashtag: payload.hashtag,
      Category: payload.category,
      InvestmentCapital: payload.investmentCapital,
      MetaTitle: payload.metaTitle,
      MetaDescription: payload.metaDescription,
      MetaKeywords: payload.metaKeywords,
      CanonicalUrl: payload.canonicalUrl,
      EnableComments: String(payload.enableComments),
      IsPinned: String(payload.isPinned),
      IsPublished: String(payload.isPublished),
      PublishedOn: payload.publishedOn,
      AspectRatios: '16:9',
    };
    const createdBy = this.auth.session()?.publicKey;
    if (createdBy) fields['CreatedBy'] = createdBy;
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    if (payload.image) formData.append('Images', payload.image, payload.image.name);

    return this.http.post<ApiEnvelope<BlogPost>>(`${this.apiUrl}/manage`, formData, {
      headers: this.adminHeaders(),
    });
  }

  private publicHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Cache-Control': 'no-cache', Pragma: 'no-cache' });
    if (!this.isBrowser) {
      headers = headers
        .set('Origin', 'https://researchmantra.in')
        .set('Referer', 'https://researchmantra.in/blogs')
        .set('User-Agent', 'Mozilla/5.0 (compatible; ResearchMantraSSR/1.0; +https://researchmantra.in)');
    }
    return headers;
  }

  private adminHeaders(): HttpHeaders {
    const token = this.auth.session()?.accessToken;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
