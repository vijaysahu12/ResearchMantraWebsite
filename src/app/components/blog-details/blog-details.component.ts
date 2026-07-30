import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService, BlogPost } from '../../services/blog.service';
import { AdminBlogService } from '../../services/admin-blog.service';
import { SeoService } from '../../services/seo.service';
import { LeadService } from '../../services/lead.service';
import { ShareModalComponent } from '../share-modal/share-modal.component';
import { LeadCaptureModalComponent } from '../lead-capture-modal/lead-capture-modal.component';

@Component({
    selector: 'app-blog-details',
    imports: [CommonModule, RouterLink, ShareModalComponent, LeadCaptureModalComponent],
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
                <header class="blog-hero">
                    @if (blog()?.image) {
                        <img class="hero-cover" [src]="blog()?.image" [alt]="blog()?.title || 'Research Mantra blog cover'" />
                    }
                    <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <h1 class="blog-title">{{ blog()?.title }}</h1>
                        <div class="hero-tagline">
                            @if (blog()?.publishedOn ?? blog()?.date) {
                                <span class="tagline-item">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    {{ (blog()?.publishedOn ?? blog()?.date) | date:'MMMM d, yyyy' }}
                                </span>
                                <span class="tagline-dot" aria-hidden="true">·</span>
                            }
                            <span class="tagline-item">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                By Susmitha Sahoo
                            </span>
                            <span class="tagline-dot" aria-hidden="true">·</span>
                            <span class="tagline-item tagline-sebi">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                                SEBI Registered
                            </span>
                        </div>
                    </div>

                    <div class="bg-text-overlay">
                        {{ blog()?.title }}
                    </div>
                </header>

                <div class="content-layout">
                    <div class="content-row">
                    <!-- Main Content -->
                    <div class="article-body">
                        <div class="content-card">
                            <h2 class="article-inner-title">{{ blog()?.title }}</h2>
                            <div
                                class="content-wrapper"
                                [innerHTML]="sanitizedContent()"
                                (click)="onContentClick($event)">
                            </div>

                            @if (blog()?.faqs?.length) {
                                <section id="faqs" class="blog-faqs" aria-labelledby="blog-faqs-title">
                                    <h2 id="blog-faqs-title">Frequently Asked Questions</h2>
                                    <div class="blog-faq-list">
                                        @for (faq of blog()?.faqs ?? []; track faq.question) {
                                            <section
                                                class="blog-faq-item"
                                                [class.expanded]="expandedFaqIndex() === $index">
                                                <h3>
                                                    <button
                                                        type="button"
                                                        class="blog-faq-header"
                                                        [attr.aria-expanded]="expandedFaqIndex() === $index"
                                                        [attr.aria-controls]="'blog-faq-answer-' + $index"
                                                        (click)="toggleFaq($index)">
                                                        <span class="blog-faq-question">{{ faq.question }}</span>
                                                        <span class="blog-faq-toggle" aria-hidden="true">
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                width="18"
                                                                height="18"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                stroke-width="2.4"
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round">
                                                                <polyline points="6 9 12 15 18 9"></polyline>
                                                            </svg>
                                                        </span>
                                                    </button>
                                                </h3>
                                                <div
                                                    class="blog-faq-answer"
                                                    [class.show]="expandedFaqIndex() === $index"
                                                    [attr.aria-hidden]="expandedFaqIndex() !== $index"
                                                    [attr.inert]="expandedFaqIndex() === $index ? null : ''"
                                                    [id]="'blog-faq-answer-' + $index">
                                                    <div class="blog-faq-answer-inner">
                                                        <div [innerHTML]="sanitizeHtml(faq.answer)"></div>
                                                    </div>
                                                </div>
                                            </section>
                                        }
                                    </div>
                                </section>
                            }

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

                                    <button type="button" class="interaction-btn share-btn" (click)="openShareModal()">
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="18" cy="5" r="3"></circle>
                                            <circle cx="6" cy="12" r="3"></circle>
                                            <circle cx="18" cy="19" r="3"></circle>
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                        </svg>
                                        <span>Share</span>
                                    </button>
                                </div>

                                <!-- Comments Section (Toggleable) -->
                                @if (blog()?.enableComments && showComments()) {
                                    <section class="comments-section">
                                        <div class="comments-header-row">
                                            <h3 class="comments-title">Discussion ({{ commentsCount() }})</h3>
                                            <button class="close-comments" (click)="toggleComments()">✕</button>
                                        </div>
                                        
                                        <div class="comment-form">
                                            @if (visitorName()) {
                                                <div class="commenter-identity">
                                                    <div class="commenter-avatar" aria-hidden="true">{{ visitorName().charAt(0).toUpperCase() }}</div>
                                                    <span class="commenter-name">Commenting as <strong>{{ visitorName() }}</strong></span>
                                                </div>
                                            }
                                            <textarea #commentInput
                                                      (input)="0"
                                                      [placeholder]="visitorName() ? 'Share your thoughts, ' + visitorName() + '...' : 'Write your comment here...'"
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

                            <!-- Back to Blogs + Share -->
                            <div class="article-footer">
                                <a href="javascript:void(0)" (click)="goBack($event)" class="back-link">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="19" y1="12" x2="5" y2="12"></line>
                                        <polyline points="12 19 5 12 12 5"></polyline>
                                    </svg>
                                    Back to Blogs
                                </a>
                                <button type="button" class="footer-share-btn" (click)="openShareModal()">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                    </svg>
                                    Share Article
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Calendar Sidebar -->
                    <aside class="blog-sidebar" aria-label="Posts calendar">
                        <div class="calendar-widget">
                            <h3 class="cal-title">Posts By Month</h3>
                            <div class="cal-header">
                                <button type="button" class="cal-nav" (click)="prevMonth()" aria-label="Previous month">&#8249;</button>
                                <span class="cal-month-label">{{ calendarMonthLabel() }}</span>
                                <button type="button" class="cal-nav" (click)="nextMonth()" aria-label="Next month">&#8250;</button>
                            </div>
                            <div class="cal-weekdays">
                                @for (d of weekDays; track d) {
                                    <span>{{ d }}</span>
                                }
                            </div>
                            <div class="cal-grid">
                                @if (calendarLoading()) {
                                    <div class="cal-loading" aria-live="polite">Loading…</div>
                                } @else {
                                    @for (cell of calendarCells(); track $index) {
                                        <div class="cal-cell"
                                             [class.has-post]="cell.hasPost"
                                             [class.empty-cell]="!cell.day"
                                             [class.clickable]="cell.hasPost"
                                             (click)="onCalendarCellClick(cell)"
                                             (keydown.enter)="onCalendarCellClick(cell)"
                                             [attr.role]="cell.hasPost ? 'button' : null"
                                             [attr.tabindex]="cell.hasPost ? 0 : null"
                                             [attr.aria-label]="cell.hasPost ? 'View posts from day ' + cell.day : null">
                                            @if (cell.day) {
                                                <span class="cal-day-num">{{ cell.day }}</span>
                                                @if (cell.hasPost) {
                                                    <span class="cal-dot" aria-hidden="true"></span>
                                                }
                                            }
                                        </div>
                                    }
                                }
                            </div>
                        </div>
                    </aside>
                    </div>
                </div>
            </article>

            <!-- ===== You May Also Like ===== -->
            @if (relatedBlogs().length > 0) {
                <section class="related-section" aria-label="You may also like">
                    <div class="related-inner">
                        <h2 class="related-heading">You May Also Like</h2>
                        <div class="related-grid">
                            @for (rb of relatedBlogs(); track rb.id) {
                                <article
                                    class="rc-card"
                                    (click)="navigateToRelated(rb.slug)"
                                    (keydown.enter)="navigateToRelated(rb.slug)"
                                    tabindex="0"
                                    role="button"
                                    [attr.aria-label]="'Read: ' + rb.title"
                                >
                                    <div class="rc-img-wrap">
                                        <img [src]="rb.image || 'assets/default-blog.jpg'" [alt]="rb.imageAlt || rb.title" loading="lazy" />
                                        @if (rb.category) {
                                            <span class="rc-cat">{{ rb.category }}</span>
                                        }
                                    </div>
                                    <div class="rc-body">
                                        <span class="rc-date">{{ rb.date }}</span>
                                        <h3 class="rc-title">{{ rb.title }}</h3>
                                        <p class="rc-excerpt">{{ rb.excerpt }}</p>
                                        <span class="rc-read-more">
                                            Read More
                                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                <polyline points="12 5 19 12 12 19"></polyline>
                                            </svg>
                                        </span>
                                    </div>
                                </article>
                            }
                        </div>
                    </div>
                </section>
            }

        } @else {
            <!-- 404: slug not found in hardcoded blogs OR API -->
            <div class="loading-state" style="padding: 100px; text-align: center;">
                <h2>Post Not Found</h2>
                <p>The blog post you are looking for doesn't exist.</p>
                <a routerLink="/blogs" class="btn-outline" style="display: inline-block; margin-top: 20px;">Back to Blogs</a>
            </div>
        }

        @if (showShareModal()) {
            <app-share-modal
                [shareUrl]="blogShareUrl()"
                [shareTitle]="blog()?.title ?? ''"
                (closed)="closeShareModal()"
            ></app-share-modal>
        }

        @if (showLeadModal()) {
            <app-lead-capture-modal
                (submitted)="onLeadSubmitted($event)"
                (closed)="onLeadModalClosed()"
            ></app-lead-capture-modal>
        }
    `,
    styles: [`
        .blog-detail-container {
            min-height: 100vh;
            background:
                radial-gradient(circle at 8% 24%, rgba(219, 234, 254, 0.55), transparent 24rem),
                radial-gradient(circle at 92% 54%, rgba(254, 243, 199, 0.42), transparent 22rem),
                #f8fafc;
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
            background:
                linear-gradient(120deg, rgba(15, 23, 42, 0.78), rgba(30, 58, 138, 0.52)),
                linear-gradient(to bottom, rgba(0, 0, 0, 0.08), rgba(15, 23, 42, 0.78));
            z-index: 1;
        }

        .hero-cover {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .blog-byline {
            margin: 18px 0 0;
            font-weight: 600;
            color: #f8fafc;
        }

        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 1000px;
            text-shadow: 0 3px 22px rgba(15, 23, 42, 0.5);
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
            margin-bottom: 16px;
            letter-spacing: -0.02em;
        }

        .hero-tagline {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 4px;
        }

        .tagline-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 13.5px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.90);
            letter-spacing: 0.01em;
        }

        .tagline-sebi {
            color: #fde68a;
            font-weight: 600;
        }

        .tagline-dot {
            color: rgba(255, 255, 255, 0.45);
            font-size: 16px;
            line-height: 1;
        }

        @media (max-width: 600px) {
            .hero-tagline {
                gap: 7px;
            }
            .tagline-item {
                font-size: 12px;
            }
        }

        .content-layout {
            max-width: 900px;
            margin: -100px auto 100px;
            padding: 0 24px;
            position: relative;
            z-index: 10;
        }

        .content-card {
            width: 100%;
            min-width: 0;
            max-width: 100%;
            background: #ffffff;
            border-radius: 20px;
            padding: 60px;
            border: 1px solid rgba(226, 232, 240, 0.85);
            box-shadow: 0 30px 70px -34px rgba(15, 23, 42, 0.3);
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
            font-size: 17px;
            line-height: 1.78;
            color: #334155;
        }

        .content-wrapper ::ng-deep h1 {
            font-size: 32px;
            font-weight: 800;
            color: #172554;
            margin-bottom: 40px;
            line-height: 1.25;
            letter-spacing: -0.025em;
        }

        .content-wrapper ::ng-deep h2 {
            font-size: 28px;
            font-weight: 750;
            color: #172554;
            margin: 52px 0 18px;
            line-height: 1.3;
            letter-spacing: -0.018em;
        }

        .content-wrapper ::ng-deep h3 {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin: 38px 0 16px;
            line-height: 1.35;
        }

        .content-wrapper ::ng-deep h4 {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin: 32px 0 14px;
        }

        .content-wrapper ::ng-deep p {
            margin: 0 0 20px;
        }

        .content-wrapper ::ng-deep a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 600;
            text-underline-offset: 3px;
            transition: color 0.2s ease, text-decoration-color 0.2s ease;
        }

        .content-wrapper ::ng-deep a:hover,
        .content-wrapper ::ng-deep a:focus-visible {
            color: #1d4ed8;
            text-decoration: underline;
        }

        .content-wrapper ::ng-deep a:focus-visible {
            border-radius: 3px;
            outline: 3px solid rgba(37, 99, 235, 0.25);
            outline-offset: 3px;
        }

        .content-wrapper ::ng-deep ul:not([class]),
        .content-wrapper ::ng-deep ol:not([class]) {
            margin: 0 0 24px;
            padding-left: 1.4rem;
        }

        .content-wrapper ::ng-deep li:not([class]) {
            margin-bottom: 8px;
            padding-left: 4px;
        }

        .content-wrapper ::ng-deep li:not([class])::marker {
            color: #2563eb;
            font-weight: 700;
        }

        .content-wrapper ::ng-deep blockquote {
            margin: 28px 0;
            padding: 18px 22px;
            border-left: 4px solid #f8b018;
            border-radius: 0 12px 12px 0;
            background: #fffbeb;
            color: #475569;
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
    width: auto !important;
    height: auto !important;
    max-height: 480px !important;
    display: block;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    margin: 28px auto;
    box-shadow: 0 18px 36px -24px rgba(15, 23, 42, 0.45);
}

/* Ensure iframes (videos) are responsive */
.content-wrapper ::ng-deep iframe {
    max-width: 100% !important;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
}

/* Related Guide callout box, used inline within blog content HTML */
.content-wrapper ::ng-deep .rm-related-guide {
    display: block;
    margin: 32px 0;
    padding: 24px 28px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #2563eb;
    border-radius: 14px;
    text-decoration: none !important;
    box-shadow: 0 8px 24px -22px rgba(15, 23, 42, 0.5);
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.content-wrapper ::ng-deep .rm-related-guide:hover {
    border-color: #bfdbfe;
    box-shadow: 0 16px 30px -24px rgba(30, 64, 175, 0.55);
    transform: translateY(-1px);
}

.content-wrapper ::ng-deep .rm-related-guide-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #2563eb;
    margin-bottom: 10px;
}

.content-wrapper ::ng-deep .rm-related-guide-title {
    display: block;
    font-size: 19px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
}

.content-wrapper ::ng-deep .rm-related-guide-desc {
    display: block;
    font-size: 15px;
    line-height: 1.6;
    color: #4b5563;
    margin-bottom: 14px;
}

.content-wrapper ::ng-deep .rm-related-guide-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 700;
    color: #1d4ed8 !important;
}

.content-wrapper ::ng-deep .rm-related-guide-title:hover,
.content-wrapper ::ng-deep .rm-related-guide-title:focus-visible,
.content-wrapper ::ng-deep .rm-related-guide-cta:hover,
.content-wrapper ::ng-deep .rm-related-guide-cta:focus-visible {
    text-decoration: underline !important;
}

.content-wrapper ::ng-deep [id],
.blog-faqs {
    scroll-margin-top: 110px;
}

.blog-faqs {
    margin-top: 40px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
}

.blog-faqs > h2 {
    margin: 28px 0 20px;
    color: #172554;
    font-size: clamp(1.5rem, 3vw, 2rem);
}

.blog-faq-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.blog-faq-item {
    position: relative;
    overflow: hidden;
    border: 1px solid #eceff3;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
    transition: box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.blog-faq-item::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: linear-gradient(180deg, #facc15, #f8b018);
    content: "";
    transform: scaleY(0);
    transform-origin: top;
    transition: transform 0.3s ease;
}

.blog-faq-item:hover {
    border-color: #dfe4ea;
    box-shadow: 0 12px 24px -16px rgba(15, 23, 42, 0.25);
}

.blog-faq-item.expanded {
    border-color: rgba(248, 176, 24, 0.45);
    background: rgba(248, 176, 24, 0.035);
    box-shadow: 0 18px 34px -20px rgba(248, 176, 24, 0.4);
}

.blog-faq-item.expanded::before {
    transform: scaleY(1);
}

.blog-faq-item h3 {
    margin: 0;
}

.blog-faq-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 20px 22px;
    border: 0;
    background: transparent;
    color: #111827;
    text-align: left;
    cursor: pointer;
}

.blog-faq-header:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.45);
    outline-offset: -3px;
}

.blog-faq-question {
    font-size: 16.5px;
    font-weight: 600;
    line-height: 1.4;
    transition: color 0.25s ease;
}

.blog-faq-item.expanded .blog-faq-question {
    color: #92610a;
}

.blog-faq-toggle {
    width: 34px;
    height: 34px;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    transition: transform 0.35s ease, background 0.25s ease, color 0.25s ease;
}

.blog-faq-item.expanded .blog-faq-toggle {
    background: linear-gradient(135deg, #facc15, #f8b018);
    color: #1a1a1a;
    transform: rotate(180deg);
}

.blog-faq-answer {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.35s ease;
}

.blog-faq-answer.show {
    grid-template-rows: 1fr;
}

.blog-faq-answer-inner {
    min-height: 0;
    overflow: hidden;
    padding: 0 22px;
    color: #64748b;
    font-size: 15px;
    line-height: 1.7;
}

.blog-faq-answer.show .blog-faq-answer-inner {
    padding-bottom: 22px;
}

.blog-faq-answer-inner ::ng-deep p {
    margin: 0 0 10px;
}

.blog-faq-answer-inner ::ng-deep p:last-child,
.blog-faq-answer-inner ::ng-deep ul:last-child,
.blog-faq-answer-inner ::ng-deep ol:last-child {
    margin-bottom: 0;
}

/* Insight / key-takeaway callout used inline within blog content HTML */
.content-wrapper ::ng-deep .rm-note {
    margin: 28px 0;
    padding: 20px 24px;
    background: #eff6ff;
    border-radius: 12px;
    border: 1px solid #dbeafe;
}

.content-wrapper ::ng-deep .rm-note-label {
    font-size: 15px;
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 6px;
}

.content-wrapper ::ng-deep .rm-note p {
    margin: 0;
    font-size: 15.5px;
    color: #374151;
}

/* Comparison tables used inline within blog content HTML */
.content-wrapper ::ng-deep .table-container {
    max-width: 100%;
    overflow-x: auto;
    margin: 28px 0;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
}

.content-wrapper ::ng-deep .comparison-table {
    width: 100%;
    min-width: 480px;
    border-collapse: collapse;
    font-size: 15px;
}

.content-wrapper ::ng-deep .comparison-table th {
    background: #1e3a8a;
    color: #ffffff;
    text-align: left;
    padding: 14px 18px;
    font-weight: 700;
    white-space: nowrap;
}

.content-wrapper ::ng-deep .comparison-table td {
    padding: 14px 18px;
    border-bottom: 1px solid #e5e7eb;
    color: #374151;
}

.content-wrapper ::ng-deep .comparison-table tbody tr:last-child td {
    border-bottom: none;
}

.content-wrapper ::ng-deep .comparison-table tbody tr:nth-child(even) {
    background: #f9fafb;
}

.content-wrapper ::ng-deep .comparison-table tbody tr {
    transition: background 0.2s ease;
}

.content-wrapper ::ng-deep .comparison-table tbody tr:hover {
    background: #eff6ff;
}

/* CTA box used inline within blog content HTML */
.content-wrapper ::ng-deep .rm-cta-box {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    max-width: 760px;
    margin: 28px auto;
    padding: 22px 24px;
    border: 1px solid rgba(147, 197, 253, 0.35);
    border-radius: 18px;
    background:
        radial-gradient(circle at 95% 10%, rgba(96, 165, 250, 0.35), transparent 35%),
        linear-gradient(135deg, #172554 0%, #1e3a8a 48%, #1d4ed8 100%);
    color: #ffffff;
    box-shadow: 0 18px 42px -26px rgba(30, 64, 175, 0.85);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.content-wrapper ::ng-deep .rm-cta-box::before {
    position: absolute;
    z-index: -1;
    top: -55px;
    right: -42px;
    width: 150px;
    height: 150px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    content: "";
    animation: rm-cta-float 6s ease-in-out infinite;
}

.content-wrapper ::ng-deep .rm-cta-box::after {
    position: absolute;
    z-index: -1;
    bottom: -70px;
    left: 38%;
    width: 180px;
    height: 110px;
    border-radius: 50%;
    background: rgba(250, 204, 21, 0.1);
    filter: blur(12px);
    content: "";
    animation: rm-cta-glow 5s ease-in-out infinite alternate;
}

.content-wrapper ::ng-deep .rm-cta-box:hover {
    box-shadow: 0 24px 50px -28px rgba(30, 64, 175, 0.95);
    transform: translateY(-2px);
}

.content-wrapper ::ng-deep .rm-cta-box-title {
    position: relative;
    font-size: clamp(17px, 2vw, 19px);
    font-weight: 800;
    line-height: 1.35;
    margin-bottom: 8px;
    color: #ffffff;
}

.content-wrapper ::ng-deep .rm-cta-box p {
    position: relative;
    max-width: 68ch;
    color: #dbeafe;
    font-size: 14.5px;
    line-height: 1.6;
    margin: 0 0 10px;
}

.content-wrapper ::ng-deep .rm-cta-box ul {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 18px;
    margin: 12px 0 16px;
    padding: 0;
    list-style: none;
}

.content-wrapper ::ng-deep .rm-cta-box li {
    color: #eff6ff;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
}

.content-wrapper ::ng-deep .rm-cta-box a {
    position: relative;
    display: flex !important;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    width: fit-content;
    margin: 14px auto 0;
    background: #ffffff !important;
    color: #1d4ed8 !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    padding: 9px 18px !important;
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 10px !important;
    box-shadow: 0 8px 20px -12px rgba(15, 23, 42, 0.7);
    text-decoration: none !important;
    transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.content-wrapper ::ng-deep .rm-cta-box a:hover,
.content-wrapper ::ng-deep .rm-cta-box a:focus-visible {
    background: #fefce8 !important;
    box-shadow: 0 12px 24px -12px rgba(15, 23, 42, 0.8);
    text-decoration: none !important;
    transform: translateY(-2px);
}

.content-wrapper ::ng-deep .rm-cta-box a:focus-visible {
    outline: 3px solid #facc15;
    outline-offset: 3px;
}

@keyframes rm-cta-float {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(-8px, 8px, 0); }
}

@keyframes rm-cta-glow {
    from { opacity: 0.45; transform: scale(0.9); }
    to { opacity: 0.9; transform: scale(1.12); }
}

.content-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    background: #ffffff;
    border-radius: 20px;
    padding: 60px;
    border: 1px solid rgba(226, 232, 240, 0.85);
    box-shadow: 0 30px 70px -34px rgba(15, 23, 42, 0.3);
    position: relative;
    animation: rm-content-enter 0.55s ease-out both;
    /* Remove max-height and overflow:visible entirely
       to let the natural flow of the document take over */
}

@keyframes rm-content-enter {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
    .content-wrapper ::ng-deep .rm-cta-box {
        margin: 24px 0;
        padding: 20px;
        border-radius: 15px;
    }

    .content-wrapper ::ng-deep .rm-cta-box ul {
        grid-template-columns: 1fr;
        gap: 5px;
    }

    .content-wrapper ::ng-deep .rm-cta-box a {
        width: 100%;
    }

    .content-wrapper {
        font-size: 16px;
        line-height: 1.72;
    }

    .content-wrapper ::ng-deep h1 {
        font-size: 27px;
        margin-bottom: 28px;
    }

    .content-wrapper ::ng-deep h2 {
        font-size: 24px;
        margin-top: 40px;
    }

    .content-wrapper ::ng-deep h3 {
        font-size: 20px;
        margin-top: 32px;
    }

    .content-wrapper ::ng-deep h4 {
        font-size: 18px;
    }

    .content-wrapper ::ng-deep .rm-related-guide {
        padding: 20px;
    }

    .content-card {
        padding: 30px 20px; /* Reduce padding on mobile */
        border-radius: 0;     /* Full width looks better on mobile */
    }
    .content-layout {
        padding: 0;          /* Remove side padding to save space */
    }
}

@media (prefers-reduced-motion: reduce) {
    .content-wrapper ::ng-deep .rm-cta-box,
    .content-wrapper ::ng-deep .rm-cta-box::before,
    .content-wrapper ::ng-deep .rm-cta-box::after,
    .content-wrapper ::ng-deep .rm-cta-box a,
    .content-wrapper ::ng-deep .rm-related-guide,
    .content-card {
        animation: none;
        transition: none;
    }
}
        .article-footer {
            margin-top: 60px;
            padding-top: 40px;
            border-top: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
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

        .footer-share-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 22px;
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 10px -2px rgba(30, 58, 138, 0.35);
        }

        .footer-share-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px -4px rgba(30, 58, 138, 0.45);
        }

        .share-btn {
            margin-left: auto;
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

        .commenter-identity {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 14px;
            padding: 10px 14px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 10px;
        }

        .commenter-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #fff;
            font-size: 14px;
            flex-shrink: 0;
        }

        .commenter-name {
            font-size: 14px;
            color: #1e40af;
        }

        .commenter-name strong {
            font-weight: 700;
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

        /* ===== Two-column layout ===== */
        .content-layout {
            max-width: 1200px;
        }

        .content-row {
            display: grid;
            grid-template-columns: 1fr 280px;
            gap: 32px;
            align-items: start;
            min-width: 0;
        }

        .article-body {
            width: 100%;
            min-width: 0;
        }

        @media (max-width: 960px) {
            .content-row {
                grid-template-columns: 1fr;
            }
            .blog-sidebar {
                position: static;
            }
        }

        /* ===== Sidebar ===== */
        .blog-sidebar {
            position: sticky;
            top: 100px;
        }

        /* ===== Calendar Widget ===== */
        .calendar-widget {
            background: #ffffff;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
            border: 1px solid #e2e8f0;
        }

        .cal-title {
            font-size: 15px;
            font-weight: 700;
            color: #1e3a8a;
            margin: 0 0 14px;
        }

        .cal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
        }

        .cal-nav {
            background: none;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #64748b;
            font-size: 18px;
            line-height: 1;
            transition: all 0.2s;
            padding: 0;
            font-family: inherit;
        }

        .cal-nav:hover {
            background: #f1f5f9;
            border-color: #1e3a8a;
            color: #1e3a8a;
        }

        .cal-month-label {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
        }

        .cal-weekdays {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            margin-bottom: 4px;
        }

        .cal-weekdays span {
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            color: #687281;
            padding: 4px 0;
        }

        .cal-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }

        .cal-cell {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            padding: 4px 0 3px;
            min-height: 30px;
        }

        .cal-cell.has-post {
            background: #f0fdf4;
        }

        .cal-day-num {
            font-size: 11px;
            font-weight: 500;
            color: #374151;
            line-height: 1;
        }

        .cal-cell.has-post .cal-day-num {
            color: #15803d;
            font-weight: 700;
        }

        .cal-dot {
            display: block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #16a34a;
            margin-top: 2px;
        }

        .cal-loading {
            grid-column: 1 / -1;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
            padding: 16px 0;
        }

        .cal-cell.clickable {
            cursor: pointer;
        }

        .cal-cell.clickable:hover {
            background: #bbf7d0;
        }

        /* ── You May Also Like ─────────────────────────── */
        .related-section {
            background: #f3f4f6;
            padding: 56px 20px 64px;
        }

        .related-inner {
            max-width: 1200px;
            margin: 0 auto;
        }

        .related-heading {
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 32px;
            text-align: center;
        }

        .related-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }

        .rc-card {
            background: #fff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.07);
            cursor: pointer;
            transition: transform 0.18s, box-shadow 0.18s;
            display: flex;
            flex-direction: column;
        }

        .rc-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .rc-img-wrap {
            position: relative;
            height: 170px;
            overflow: hidden;
            flex-shrink: 0;
        }

        .rc-img-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.3s;
        }

        .rc-card:hover .rc-img-wrap img {
            transform: scale(1.04);
        }

        .rc-cat {
            position: absolute;
            top: 10px;
            left: 10px;
            padding: 3px 10px;
            background: #16a34a;
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            border-radius: 20px;
            letter-spacing: 0.3px;
        }

        .rc-body {
            padding: 16px 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
        }

        .rc-date {
            font-size: 11px;
            color: #9ca3af;
            font-weight: 500;
        }

        .rc-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.4;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .rc-excerpt {
            font-size: 12px;
            color: #6b7280;
            line-height: 1.6;
            margin: 0;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            flex: 1;
        }

        .rc-read-more {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 600;
            color: #16a34a;
            margin-top: 4px;
        }

        @media (max-width: 900px) {
            .related-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 540px) {
            .related-grid { grid-template-columns: 1fr; }
            .related-heading { font-size: 20px; }
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlogDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private blogService = inject(BlogService);
    private adminBlogService = inject(AdminBlogService);
    private sanitizer = inject(DomSanitizer);
    private seoService = inject(SeoService);
    private leadService = inject(LeadService);
    private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    goBack(event: Event) {
        event.preventDefault();
        if (this.isBrowser) window.history.back();
    }

    /** Current blog data (hardcoded or from API) */
    blog = signal<BlogPost | undefined>(undefined);
    expandedFaqIndex = signal<number | null>(null);

    toggleFaq(index: number) {
        this.expandedFaqIndex.update(currentIndex => currentIndex === index ? null : index);
    }

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

    private userId = '00000000-0000-0000-0000-000000000000';

    /** Name captured via lead modal — shown in comment form and sent with comment */
    visitorName = signal<string>(this.leadService.getLeadName());

    /** Lead-capture modal shown when a visitor wants to comment but we have no details yet */
    showLeadModal = signal<boolean>(false);
    /** Comment text held while the visitor fills in the lead modal, posted right after */
    private pendingCommentText = signal<string>('');

    /** Share modal */
    showShareModal = signal(false);
    blogShareUrl = computed(() => `https://researchmantra.in/${this.blog()?.slug ?? ''}`);

    openShareModal() { this.showShareModal.set(true); }
    closeShareModal() { this.showShareModal.set(false); }

    /** Related blogs ("You May Also Like") */
    relatedBlogs = signal<any[]>([]);

    private loadRelatedBlogs(slug: string) {
        if (!this.isBrowser) return;
        this.adminBlogService.getRelatedBlogs(slug).subscribe({
            next: (res: any) => { this.relatedBlogs.set(res?.data ?? []); },
            error: () => { this.relatedBlogs.set([]); }
        });
    }

    navigateToRelated(slug: string) {
        this.router.navigate(['/', slug]);
        if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Calendar
    calendarYear = signal<number>(0);
    calendarMonth = signal<number>(0);
    calendarLoading = signal<boolean>(false);
    postDays = signal<number[]>([]);
    readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    readonly monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    calendarMonthLabel = computed(() => {
        const m = this.calendarMonth();
        const y = this.calendarYear();
        return m ? `${this.monthNames[m - 1]} ${y}` : '';
    });

    calendarCells = computed(() => {
        const year = this.calendarYear();
        const month = this.calendarMonth();
        if (!year || !month) return [];
        const days = this.postDays();
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const cells: Array<{ day: number | null; hasPost: boolean }> = [];
        for (let i = 0; i < firstDay; i++) cells.push({ day: null, hasPost: false });
        for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, hasPost: days.includes(d) });
        return cells;
    });

    prevMonth() {
        const m = this.calendarMonth();
        const y = this.calendarYear();
        if (m === 1) { this.calendarMonth.set(12); this.calendarYear.set(y - 1); }
        else { this.calendarMonth.set(m - 1); }
        this.loadCalendarDates();
    }

    nextMonth() {
        const m = this.calendarMonth();
        const y = this.calendarYear();
        if (m === 12) { this.calendarMonth.set(1); this.calendarYear.set(y + 1); }
        else { this.calendarMonth.set(m + 1); }
        this.loadCalendarDates();
    }

    private loadCalendarDates() {
        if (!this.isBrowser) return;
        this.calendarLoading.set(true);
        this.adminBlogService.getCalendarDates(this.calendarYear(), this.calendarMonth()).subscribe({
            next: (res: any) => {
                this.postDays.set(res?.data?.days ?? []);
                this.calendarLoading.set(false);
            },
            error: () => {
                this.postDays.set([]);
                this.calendarLoading.set(false);
            }
        });
    }

    onCalendarCellClick(cell: { day: number | null; hasPost: boolean }) {
        if (!cell.hasPost || !cell.day) return;
        const y = this.calendarYear();
        const m = this.calendarMonth();
        const mm = String(m).padStart(2, '0');
        const dd = String(cell.day).padStart(2, '0');
        this.router.navigate(['/stock-market-analysis-and-nifty-updates'], { queryParams: { date: `${y}-${mm}-${dd}` } });
    }

    sanitizedContent = computed(() => {
        const content = this.blog()?.content;
        return content ? this.sanitizer.bypassSecurityTrustHtml(content) : '';
    });

    sanitizeHtml(content: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(content);
    }

    onContentClick(event: MouseEvent) {
        if (!this.isBrowser) return;

        const target = event.target;
        if (!(target instanceof Element)) return;

        const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
        const fragment = anchor?.getAttribute('href')?.slice(1);
        if (!anchor || !fragment) return;

        const destination = document.getElementById(decodeURIComponent(fragment));
        if (!destination) return;

        event.preventDefault();
        destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `#${fragment}`);
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const slugValue = params['slug'];
            this.expandedFaqIndex.set(null);

            if (!slugValue) {
                this.loading.set(false);
                return;
            }

            // Step 1: Check hardcoded blogs first
            const foundBlog = this.blogService.getBlogBySlug(slugValue);

            if (foundBlog) {
                this.blog.set(foundBlog);
                this.updateSeoTags(foundBlog);
                this.loadRelatedBlogs(slugValue);
                this.loading.set(false);
                this.ensureVisitorIdentity();
                if (this.isBrowser) window.scrollTo(0, 0);
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
                        this.loadRelatedBlogs(slugValue);

                        // Fetch comments and likes for dynamic blogs
                        this.commentsCount.set(apiData.commentsCount || 0);
                        this.likesCount.set(apiData.likesCount || 0);
                        
                        const localLiked = this.isBrowser ? localStorage.getItem(`blog_liked_${apiData.id}`) : null;
                        this.isLiked.set(localLiked === 'true' ? true : (apiData.isLiked || false));
                        
                        if (apiData.enableComments) {
                            this.loadComments(apiData.id);
                        }

                        // Check cookie for the visitor's name; if missing, prompt for it.
                        this.ensureVisitorIdentity();
                    }
                    this.loading.set(false);
                    if (this.isBrowser) window.scrollTo(0, 0);
                },
                error: () => {
                    this.loading.set(false);
                    if (this.isBrowser) window.scrollTo(0, 0);
                }
            });
        });

        // Init calendar with current month
        const now = new Date();
        this.calendarYear.set(now.getFullYear());
        this.calendarMonth.set(now.getMonth() + 1);
        this.loadCalendarDates();
    }

    private loadComments(blogId: any) {
        if (!blogId) return;
        this.adminBlogService.getComments(blogId).subscribe({
            next: (res: any) => {
                if (res.statusCode === 200) {
                    this.comments.set(res.data || []);
                }
            },
            error: () => this.comments.set([]),
        });
    }

    toggleComments() {
        this.showComments.update(show => !show);
        if (this.showComments() && this.comments().length === 0 && this.blog()?.id) {
            this.loadComments(this.blog()?.id);
        }
    }

    /**
     * On the detail page: read the visitor's name from the cookie (falling back to
     * localStorage). If we already have it, use it; otherwise open the lead-capture
     * popup so the name + number are ready when they comment.
     */
    private ensureVisitorIdentity() {
        if (!this.isBrowser) return;

        const storedName = this.leadService.getLeadName();
        if (storedName) {
            // Found in cookie — refresh the in-memory name, no popup needed.
            this.visitorName.set(storedName);
            return;
        }

        // No details saved yet — prompt for them (only when the blog allows comments).
        if (this.blog()?.enableComments) {
            this.showLeadModal.set(true);
        }
    }

    submitComment(text: string) {
        const currentBlog = this.blog();
        if (!text.trim() || !currentBlog?.id) return;

        // We need the visitor's name before posting. If we don't have it yet,
        // hold the comment and open the lead-capture modal first.
        if (this.isBrowser && !this.leadService.hasLeadData()) {
            this.pendingCommentText.set(text);
            this.showLeadModal.set(true);
            return;
        }

        this.postComment(text);
    }

    /** Called by the lead modal once the visitor submits their name + mobile. */
    onLeadSubmitted(data: { name: string; mobile: string }) {
        // The modal already persists the details via LeadService.saveLeadData().
        this.visitorName.set(data.name);
        this.showLeadModal.set(false);

        const pending = this.pendingCommentText();
        if (pending.trim()) {
            this.pendingCommentText.set('');
            this.postComment(pending);
        }
    }

    onLeadModalClosed() {
        this.showLeadModal.set(false);
        this.pendingCommentText.set('');
    }

    private postComment(text: string) {
        const currentBlog = this.blog();
        if (!text.trim() || !currentBlog?.id) return;

        this.isSubmittingComment.set(true);
        const request = {
            blogId: currentBlog.id,
            comment: text,
            parentCommentId: null,
            authorName: this.visitorName() || 'Anonymous',
            mobileNumber: this.leadService.getLeadMobile() || '',
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
        const canonicalUrl = `https://researchmantra.in/${blog.slug}`;

        this.seoService.setMetaTags({
            title: pageTitle,
            description: description,
            keywords: blog.keywords,
            image: blog.image,
            type: 'article',
            canonicalUrl
        });
    }
}
