import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { BlogService, BlogPost } from '../../services/blog.service';
import { SeoService } from '../../services/seo.service';
import { AdminBlogService } from '../../services/admin-blog.service';

@Component({
  selector: 'app-admin-blog-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-blog-details.html',
  styleUrl: './admin-blog-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminBlogDetails implements OnInit {
    private route = inject(ActivatedRoute);
    // Hardcoded blog service — checked first to preserve Google-indexed blogs
    private hardcodedBlogService = inject(BlogService);
    // Admin API blog service — used as fallback
    private adminBlogService = inject(AdminBlogService);
    private sanitizer = inject(DomSanitizer);
    private seoService = inject(SeoService);

    /** Current blog data (hardcoded or from API) */
    blog = signal<BlogPost | undefined>(undefined);

    /** Loading state — true while checking hardcoded + API */
    loading = signal<boolean>(true);

    sanitizedContent = computed(() => {
        const content = this.blog()?.content;
        return content ? this.sanitizer.bypassSecurityTrustHtml(content) : '';
    });

    ngOnInit() {
        const slugValue = this.route.snapshot.paramMap.get('slug');

        if (!slugValue) {
            this.loading.set(false);
            return;
        }

        // Step 1: Check hardcoded blogs first (these are already indexed by Google)
        const foundBlog = this.hardcodedBlogService.getBlogBySlug(slugValue);

        if (foundBlog) {
            // Step 2: Hardcoded blog found — load normally
            this.blog.set(foundBlog);
            this.updateSeoTags(foundBlog);
            this.loading.set(false);
            window.scrollTo(0, 0);
            return;
        }

        // Step 3: Not in hardcoded blogs — call the admin API
        this.loading.set(true);
        this.adminBlogService.getBlogDetails(slugValue).subscribe({
            next: (res: any) => {
                if (res?.data) {
                    // Step 4: API returned blog — map to BlogPost with fallback values
                    const apiData = res.data;
                    const mappedBlog: BlogPost = {
                        id: apiData.id ?? 0,
                        slug: apiData.slug ?? slugValue,
                        title: apiData.title ?? '',
                        excerpt: apiData.excerpt ?? '',
                        // Process HTML content for safe rendering (handles link targets)
                        content: this.adminBlogService['processBlogContent'](apiData.content ?? ''),
                        category: apiData.category ?? '',
                        date: apiData.date ?? '',
                        // Fallback values for fields the API may not return
                        author: apiData.author ?? 'Research Mantra',
                        readTime: apiData.readTime ?? '5 min read',
                        image: apiData.image ?? 'assets/default-blog.jpg',
                        // SEO fallback chain: metaTitle → title, metaDescription → excerpt, keywords → category
                        metaTitle: apiData.metaTitle || apiData.title || '',
                        metaDescription: apiData.metaDescription || apiData.excerpt || '',
                        keywords: apiData.keywords || apiData.category || ''
                    };

                    this.blog.set(mappedBlog);
                    this.updateSeoTags(mappedBlog);
                }
                // If res.data is null/undefined, blog stays undefined → shows 404
                this.loading.set(false);
                window.scrollTo(0, 0);
            },
            error: () => {
                // Step 5: API error — show 404
                this.loading.set(false);
                window.scrollTo(0, 0);
            }
        });
    }

    /**
     * Sets all SEO meta tags for the current blog post.
     * Works identically for both hardcoded and API-sourced blogs.
     * Sets: <title>, description, keywords, og:title, og:description, og:image, og:url, og:type,
     *        twitter:title, twitter:description, twitter:image, twitter:card, canonical URL
     */
    private updateSeoTags(blog: BlogPost) {
        const pageTitle = blog.metaTitle || blog.title;
        const description = blog.metaDescription || blog.excerpt;

        this.seoService.setMetaTags({
            title: pageTitle,
            description: description,
            keywords: blog.keywords,
            image: blog.image,
            type: 'article'
        });
    }
}
