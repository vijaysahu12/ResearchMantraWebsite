import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BlogPost {
    id: number | string;
    slug: string;
    title: string;
    excerpt: string;
    content?: string;
    category: string;
    date: string;
    author: string;
    readTime: string;
    image: string;
    images: any[];
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    likesCount?: number;
    isLiked?: boolean;
    comments?: any[];
    enableComments?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AdminBlogService {


    constructor() {
    }

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
private blogs = signal<any[]>([]);

     private apiUrl = `${environment.apiurl}WebsiteBlog`;
 private http = inject(HttpClient);
    // getBlogs() {
    //     return this.blogsData;
    // }

    // getBlogBySlug(slug: string) {
    //     return this.blogsData().find(blog => blog.slug === slug);
    // }

//     getBlogBySlug(slug: string) {
//   return this.blogs().find(blog => blog.slug === slug);
// }

loadBlogs(page = 1, size = 10) {
  console.log('🧹 [Service] Clearing existing data...');
  this.blogs.set([]);

  const ts = Date.now(); // cache buster

  console.log(`🚀 [Service] API Call started - Page: ${page}`);

  this.http.get<any>(
    `${this.apiUrl}/GetAllWebsiteBlogs?pageNumber=${page}&pageSize=${size}&_=${ts}`,
    {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }
  ).subscribe({
    next: (res) => {
      const mappedData = (res?.data ?? []).map((b: any) => ({
        ...b,
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

   getBlogs() {
    return this.blogs; // returning signal
  }

getBlogDetails(slug: string) {
  return this.http.get(`${this.apiUrl}/GetBlogBySlug/${slug}`);
}

  addComment(payload: any) {
    return this.http.post(`${this.apiUrl}/AddComment`, payload);
  }

  getComments(blogId: string): Observable<any> {
  // Adjust the URL to match your ASP.NET Core Routing
  return this.http.get(`${this.apiUrl}/${blogId}/comments`);
}

toggleLike(blogId: string, userId: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/${blogId}/like`, { userId });
}
}
