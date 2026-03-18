import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService, BlogPost } from '../../services/blog.service';
import { AdminBlogService } from '../../services/admin-blog.service';
import { SeoService } from '../../services/seo.service';

@Component({
    selector: 'app-blog-details',
    imports: [CommonModule, RouterLink],
    template: `
        <!-- Loading state while checking hardcoded blogs and API -->
        @if (loading()) {
            <div class="loading-state" style="padding: 100px; text-align: center;">
                <div class="spinner" aria-label="Loading blog post"></div>
                <p>Loading blog post...</p>
            </div>
        } @else if (blog()) {
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

                            <!-- Interaction Bar (Likes & Comments Count) -->
                            @if (isApiBlog()) {
                                <div class="blog-interactions">
                                    <button
                                        type="button"
                                        class="interaction-btn"
                                        [class.liked]="isLiked()"
                                        [disabled]="isSyncingLike()"
                                        (click)="toggleLike()">
                                        <svg viewBox="0 0 24 24" width="20" height="20" [attr.fill]="isLiked() ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                        <span>{{ isSyncingLike() ? '...' : (likesCount() || 0) }}</span>
                                    </button>

                                    @if (blog()?.enableComments) {
                                        <button
                                            type="button"
                                            class="interaction-btn"
                                            [class.active]="showComments()"
                                            (click)="toggleComments()">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                            </svg>
                                            <span>{{ commentsCount() || 0 }} Comments</span>
                                        </button>
                                    }
                                </div>

                                <!-- Comments Section (Toggleable) -->
                                @if (blog()?.enableComments && showComments()) {
                                    <section class="comments-section">
                                        <div class="comments-header-row">
                                            <h3 class="comments-title">Discussion ({{ commentsCount() }})</h3>
                                            <button class="close-comments" (click)="toggleComments()">✕</button>
                                        </div>
                                        
                                        <div class="comment-form">
                                            <textarea #commentInput 
                                                      (input)="0"
                                                      placeholder="Write your comment here..."
                                                      rows="3"></textarea>
                                            <div class="form-footer">
                                                <p class="form-tip">Please keep the discussion professional.</p>
                                                <button type="button" 
                                                        class="post-btn"
                                                        [disabled]="isSubmittingComment() || !commentInput.value.trim()"
                                                        (click)="submitComment(commentInput.value); commentInput.value = ''">
                                                    {{ isSubmittingComment() ? 'Posting...' : 'Post Comment' }}
                                                </button>
                                            </div>
                                        </div>

                                        <div class="comments-list">
                                            @for (comment of comments(); track comment.id) {
                                                <div class="comment-item">
                                                    <div class="comment-header">
                                                        <div class="author-info">
                                                            <div class="author-avatar">{{ comment.authorName?.charAt(0) || 'U' }}</div>
                                                            <span class="author">{{ comment.authorName }}</span>
                                                        </div>
                                                        <span class="date">{{ comment.createdOn | date:'mediumDate' }}</span>
                                                    </div>
                                                    <p class="comment-body">{{ comment.content }}</p>
                                                </div>
                                            } @empty {
                                                <div class="no-comments">
                                                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94a3b8" stroke-width="1.5">
                                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                    </svg>
                                                    <p>Be the first to join the conversation.</p>
                                                </div>
                                            }
                                        </div>
                                    </section>
                                }
                            }

                            <!-- Back to Blogs -->
                            <div class="article-footer">
                                <a href="javascript:void(0)" (click)="goBack($event)" class="back-link">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="19" y1="12" x2="5" y2="12"></line>
                                        <polyline points="12 19 5 12 12 5"></polyline>
                                    </svg>
                                    Back to Blogs
                                </a>
                            </div>
                        </div>
                    </main>
                </div>
            </article>
        } @else {
            <!-- 404: slug not found in hardcoded blogs OR API -->
            <div class="loading-state" style="padding: 100px; text-align: center;">
                <h2>Post Not Found</h2>
                <p>The blog post you are looking for doesn't exist.</p>
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
    overflow: hidden; /* This keeps it inside the hero */
    text-overflow: clip; /* Prevents dots on the background text */
    text-transform: uppercase;
    z-index: 1;
    pointer-events: none;
    line-height: 1;
    width: 100%; /* Ensure it stays within screen bounds */
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

        .content-wrapper {
    word-wrap: break-word;      /* Break long words/URLs */
    overflow-wrap: break-word;  /* Modern browsers */
    word-break: break-word;
    max-width: 100%;            /* Stay within parent */
}

/* Ensure images from Quill/Database never exceed card width */
.content-wrapper ::ng-deep img {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 12px;
    margin: 20px 0;
}

/* Ensure iframes (videos) are responsive */
.content-wrapper ::ng-deep iframe {
    max-width: 100% !important;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
}

.content-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 60px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
    position: relative;
    /* Remove max-height and overflow:visible entirely
       to let the natural flow of the document take over */
}

@media (max-width: 768px) {
    .content-card {
        padding: 30px 20px; /* Reduce padding on mobile */
        border-radius: 0;     /* Full width looks better on mobile */
    }
    .content-layout {
        padding: 0;          /* Remove side padding to save space */
    }
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

        /* Interactions & Comments Styles */
        .blog-interactions {
            display: flex;
            gap: 16px;
            padding: 30px 0;
            margin: 50px 0 0;
            border-top: 1px solid #e2e8f0;
        }

        .interaction-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            cursor: pointer;
            color: #475569;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 10px 20px;
            border-radius: 12px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .interaction-btn:not([disabled]):hover {
            border-color: #1e3a8a;
            color: #1e3a8a;
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .interaction-btn.active, .interaction-btn.liked {
            background-color: #f1f5f9;
            border-color: #1e3a8a;
            color: #1e3a8a;
        }

        .interaction-btn.liked {
            color: #ef4444;
            border-color: #fee2e2;
            background-color: #fef2f2;
        }

        .interaction-btn.liked svg {
            fill: #ef4444;
            stroke: #ef4444;
        }

        .comments-section {
            margin-top: 24px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            animation: slideDown 0.4s ease-out;
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .comments-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }

        .comments-title {
            font-size: 22px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
        }

        .close-comments {
            background: #f1f5f9;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s;
        }

        .close-comments:hover {
            background: #e2e8f0;
            color: #0f172a;
        }

        .comment-form {
            background: #f8fafc;
            padding: 24px;
            border-radius: 16px;
            margin-bottom: 40px;
            border: 1px solid #f1f5f9;
        }

        .comment-form textarea {
            width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            font-family: inherit;
            font-size: 15px;
            resize: vertical;
            margin-bottom: 16px;
            transition: all 0.2s;
            background: #fff;
        }

        .comment-form textarea:focus {
            outline: none;
            border-color: #1e3a8a;
            box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.05);
        }

        .form-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .form-tip {
            font-size: 13px;
            color: #94a3b8;
            margin: 0;
        }

        .post-btn {
            background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
            color: #fff;
            padding: 12px 28px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);
        }

        .post-btn:hover:not([disabled]) {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.3);
        }

        .post-btn:disabled {
            background: #cbd5e1;
            box-shadow: none;
            cursor: not-allowed;
        }

        .comment-item {
            padding: 24px 0;
            border-bottom: 1px solid #f1f5f9;
        }

        .comment-item:last-child {
            border-bottom: none;
        }

        .comment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .author-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .author-avatar {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #475569;
            font-size: 14px;
        }

        .comment-header .author {
            font-weight: 700;
            color: #0f172a;
            font-size: 15px;
        }

        .comment-header .date {
            font-size: 13px;
            color: #94a3b8;
        }

        .comment-body {
            line-height: 1.7;
            color: #334155;
            padding-left: 48px;
            margin: 0;
            font-size: 15px;
        }

        .no-comments {
            text-align: center;
            padding: 60px 20px;
            color: #94a3b8;
        }

        .no-comments svg {
            margin-bottom: 16px;
            opacity: 0.5;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private blogService = inject(BlogService);
    private adminBlogService = inject(AdminBlogService);
    private sanitizer = inject(DomSanitizer);
    private seoService = inject(SeoService);

    goBack(event: Event) {
        event.preventDefault();
        window.history.back();
    }

    /** Current blog data (hardcoded or from API) */
    blog = signal<BlogPost | undefined>(undefined);

    /** Computed check to identify dynamically loaded API blogs with GUID IDs */
    isApiBlog = computed(() => {
        const id = this.blog()?.id;
        return typeof id === 'string' && id.length > 20;
    });

    /** Interactions state */
    comments = signal<any[]>([]);
    commentsCount = signal<number>(0);
    likesCount = signal<number>(0);
    isLiked = signal<boolean>(false);
    showComments = signal<boolean>(false);
    
    /** Async states */
    loading = signal<boolean>(true);
    isSyncingLike = signal<boolean>(false);
    isSubmittingComment = signal<boolean>(false);

    private userId = '00000000-0000-0000-0000-000000000000'; // Placeholder for actual user ID

    sanitizedContent = computed(() => {
        const content = this.blog()?.content;
        return content ? this.sanitizer.bypassSecurityTrustHtml(content) : '';
    });

    ngOnInit() {
        this.route.params.subscribe(params => {
            const slugValue = params['slug'];

            if (!slugValue) {
                this.loading.set(false);
                return;
            }

            // Step 1: Check hardcoded blogs first
            const foundBlog = this.blogService.getBlogBySlug(slugValue);

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
                            keywords: apiData.keywords || apiData.category || '',
                            enableComments: apiData.enableComments === true || String(apiData.enableComments).toLowerCase() === 'true'
                        };

                        this.blog.set(mappedBlog);
                        this.updateSeoTags(mappedBlog);

                        // Fetch comments and likes for dynamic blogs
                        this.commentsCount.set(apiData.commentsCount || 0);
                        this.likesCount.set(apiData.likesCount || 0);
                        
                        // Check local storage for liked status for admin blogs
                        const localLiked = localStorage.getItem(`blog_liked_${apiData.id}`);
                        if (localLiked === 'true') {
                            this.isLiked.set(true);
                        } else {
                            this.isLiked.set(apiData.isLiked || false);
                        }
                        
                        if (apiData.enableComments) {
                            this.loadComments(apiData.id);
                        }
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
        });
    }

    private loadComments(blogId: any) {
        if (!blogId) return;
        this.adminBlogService.getComments(blogId).subscribe({
            next: (res: any) => {
                if (res.statusCode === 200) {
                    this.comments.set(res.data || []);
                }
            }
        });
    }

    toggleComments() {
        this.showComments.update(show => !show);
        if (this.showComments() && this.comments().length === 0 && this.blog()?.id) {
            this.loadComments(this.blog()?.id);
        }
    }

    submitComment(text: string) {
        const currentBlog = this.blog();
        if (!text.trim() || !currentBlog?.id) return;

        this.isSubmittingComment.set(true);
        const request = {
            blogId: currentBlog.id,
            comment: text,
            parentCommentId: null
        };

        this.adminBlogService.addComment(request).subscribe({
            next: (res: any) => {
                if (res.statusCode === 200) {
                    const newComment = {
                        id: res.data.id,
                        content: res.data.content,
                        authorName: res.data.authorName,
                        createdOn: res.data.createdOn
                    };
                    this.comments.update(prev => [newComment, ...prev]);
                    this.commentsCount.update(count => count + 1);
                }
                this.isSubmittingComment.set(false);
            },
            error: () => this.isSubmittingComment.set(false)
        });
    }

    toggleLike() {
        const currentBlog = this.blog();
        if (!currentBlog?.id || this.isSyncingLike()) return;

        this.isSyncingLike.set(true);
        const wasLiked = this.isLiked();
        
        // Optimistic update
        const newLikedState = !wasLiked;
        this.isLiked.set(newLikedState);
        this.likesCount.update(count => wasLiked ? count - 1 : count + 1);
        
        // Save to local storage for admin blogs
        if (this.isApiBlog()) {
            if (newLikedState) {
                localStorage.setItem(`blog_liked_${currentBlog.id}`, 'true');
            } else {
                localStorage.removeItem(`blog_liked_${currentBlog.id}`);
            }
        }

        this.adminBlogService.toggleLike(currentBlog.id.toString(), this.userId).subscribe({
            next: (res: any) => {
                this.isLiked.set(res.data.isLiked);
                this.likesCount.set(res.data.totalLikes);
                this.isSyncingLike.set(false);
            },
            error: () => {
                // Revert on error
                this.isLiked.set(wasLiked);
                this.likesCount.update(count => wasLiked ? count + 1 : count - 1);
                
                // Revert local storage
                if (this.isApiBlog()) {
                    if (wasLiked) {
                        localStorage.setItem(`blog_liked_${currentBlog.id}`, 'true');
                    } else {
                        localStorage.removeItem(`blog_liked_${currentBlog.id}`);
                    }
                }
                
                this.isSyncingLike.set(false);
            }
        });
    }

    /**
     * Sets all SEO meta tags for the current blog post.
     * Works identically for both hardcoded and API-sourced blogs.
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
