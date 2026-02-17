import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml, Title, Meta } from '@angular/platform-browser';
import { BlogService, BlogPost } from '../../services/blog.service';

@Component({
    selector: 'app-blog-details',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        @if (blog()) {
            <article class="blog-detail-container">
                <!-- Hero Section -->
                <header class="blog-hero" [style.backgroundImage]="blog()?.image ? 'url(' + blog()?.image + ')' : 'none'">
                    <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <h1 class="blog-title">{{ blog()?.title }}</h1>
                    </div>

                    <div class="bg-text-overlay">
                        {{ blog()?.title }}
                    </div>
                </header>

                <div class="content-layout">
                    <!-- Main Content -->
                    <main class="article-body">
                        <div class="content-card">
                            <h2 class="article-inner-title">{{ blog()?.title }}</h2>
                            <div class="content-wrapper" [innerHTML]="sanitizedContent()"></div>

                            <!-- Back to Blogs -->
                            <div class="article-footer">
                                <a routerLink="/blogs" class="back-link">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="19" y1="12" x2="5" y2="12"></line>
                                        <polyline points="12 19 5 12 12 5"></polyline>
                                    </svg>
                                    Back to All Blogs
                                </a>
                            </div>
                        </div>
                    </main>
                </div>
            </article>
        } @else {
            <div class="loading-state" style="padding: 100px; text-align: center;">
                <h2>Post Not Found</h2>
                <p>The blog post you are looking for doesn't exist or is still loading.</p>
                <a routerLink="/blogs" class="btn-outline" style="display: inline-block; margin-top: 20px;">Back to Blogs</a>
            </div>
        }
    `,
    styles: [`
        .blog-detail-container {
            min-height: 100vh;
            background-color: #f8fafc;
            color: #111827;
            font-family: "Inter", system-ui, sans-serif;
        }

        .blog-hero {
            position: relative;
            height: 60vh;
            min-height: 500px;
            background-color: #111827;
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #ffffff;
            padding: 0 40px;
        }

        .hero-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.7));
            z-index: 1;
        }

        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 1000px;
        }

        .bg-text-overlay {
            position: absolute;
            bottom: 50px;
            left: 0;
            right: 0;
            font-size: clamp(60px, 12vw, 150px);
            font-weight: 900;
            color: rgba(255, 255, 255, 0.08);
            white-space: nowrap;
            overflow: hidden;
            text-transform: uppercase;
            z-index: 1;
            pointer-events: none;
            background: rgba(239, 68, 68, 0.2);
            padding: 10px 0;
            line-height: 1;
        }

        .blog-title {
            font-size: clamp(32px, 5vw, 48px);
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 0;
            letter-spacing: -0.02em;
        }

        .content-layout {
            max-width: 900px;
            margin: -100px auto 100px;
            padding: 0 24px;
            position: relative;
            z-index: 10;
        }

        .content-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 60px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
        }

        .article-inner-title {
            font-size: 32px;
            font-weight: 800;
            color: #1e3a8a;
            margin-bottom: 40px;
            line-height: 1.3;
            display: none; /* Hidden because content now has its own h1 */
        }

        .content-wrapper {
            font-size: 18px;
            line-height: 1.8;
            color: #374151;
        }

        .content-wrapper ::ng-deep h1 {
            font-size: 32px;
            font-weight: 800;
            color: #1e3a8a;
            margin-bottom: 40px;
            line-height: 1.3;
        }

        .content-wrapper ::ng-deep h2 {
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            margin: 48px 0 20px;
        }

        .content-wrapper ::ng-deep h3 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin: 40px 0 20px;
        }

        .content-wrapper ::ng-deep p {
            margin-bottom: 24px;
        }

        .content-wrapper ::ng-deep a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 600;
        }

        .content-wrapper ::ng-deep a:hover {
            text-decoration: underline;
        }

        .article-footer {
            margin-top: 60px;
            padding-top: 40px;
            border-top: 1px solid #f1f5f9;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #334155;
            font-weight: 600;
            text-decoration: none;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: #EAB308;
        }

        @media (max-width: 768px) {
            .blog-hero {
                height: 50vh;
                padding: 0 20px;
            }
            .blog-title {
                font-size: 28px;
            }
            .content-card {
                padding: 32px 20px;
                margin-top: -40px;
            }
            .article-inner-title {
                font-size: 24px;
            }
            .content-layout {
                margin-top: -60px;
            }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private blogService = inject(BlogService);
    private sanitizer = inject(DomSanitizer);
    private titleService = inject(Title);
    private metaService = inject(Meta);

    blog = signal<BlogPost | undefined>(undefined);
    sanitizedContent = computed(() => {
        const content = this.blog()?.content;
        return content ? this.sanitizer.bypassSecurityTrustHtml(content) : '';
    });

    ngOnInit() {
        this.route.params.subscribe(params => {
            const slugValue = params['slug'];

            if (slugValue) {
                const foundBlog = this.blogService.getBlogBySlug(slugValue);
                this.blog.set(foundBlog);

                if (foundBlog) {
                    this.updateSeoTags(foundBlog);
                }

                window.scrollTo(0, 0);
            }
        });
    }

    private updateSeoTags(blog: BlogPost) {
        // Set Title
        const pageTitle = blog.metaTitle || blog.title;
        this.titleService.setTitle(pageTitle);

        // Set Description
        const description = blog.metaDescription || blog.excerpt;
        this.metaService.updateTag({ name: 'description', content: description });

        // Set Keywords
        if (blog.keywords) {
            this.metaService.updateTag({ name: 'keywords', content: blog.keywords });
        }

        // Open Graph tags for social sharing
        this.metaService.updateTag({ property: 'og:title', content: pageTitle });
        this.metaService.updateTag({ property: 'og:description', content: description });
        this.metaService.updateTag({ property: 'og:image', content: blog.image });
        this.metaService.updateTag({ property: 'og:type', content: 'article' });
    }
}
