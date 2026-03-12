import { Component, ChangeDetectionStrategy, inject, signal, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';

@Component({
    selector: 'app-must-read',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
<section class="must-read-section">
    <div class="container">
        <div class="section-header">
            <div class="header-content">
                <h2 class="section-title">Must Read</h2>
                <p class="section-subtitle">Must read for investors. Learn, invest &amp; earn with us.</p>
            </div>
            <div class="read-more-wrapper">
                <a routerLink="/blogs" class="read-more-link">Read More &rarr;</a>
            </div>
        </div>

        <div class="carousel-container" (mouseenter)="stopAutoPlay()" (mouseleave)="startAutoPlay()">
            <div class="carousel-track" [style.transform]="'translateX(-' + (currentIndex() * (100 / visibleCount())) + '%)'">
                @for (blog of blogs(); track blog.id) {
                <div class="blog-card-wrapper" [style.flex]="'0 0 ' + (100 / visibleCount()) + '%'">
                    <div class="blog-card" [routerLink]="['/', blog.slug]">
                        <div class="card-image">
                            <img [src]="blog.image" [alt]="blog.title" loading="lazy">
                        </div>
                        <div class="card-body">
                            <h3 class="blog-title">{{ blog.title }}</h3>
                            <p class="blog-excerpt">{{ blog.excerpt }}</p>
                            <div class="card-footer">
                                <span class="author">{{ blog.author }}</span>
                                <span class="date">{{ blog.date }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                }
            </div>

            <button class="nav-btn prev" (click)="prev()" aria-label="Previous">&lsaquo;</button>
            <button class="nav-btn next" (click)="next()" aria-label="Next">&rsaquo;</button>
        </div>
    </div>
</section>
    `,
    styleUrl: './must-read.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MustReadComponent implements OnDestroy {
    private blogService = inject(BlogService);
    private platformId = inject(PLATFORM_ID);

    blogs = this.blogService.getBlogs();
    currentIndex = signal(0);
    visibleCount = signal(3);
    private carouselInterval: any;
    private resizeListener: (() => void) | null = null;

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.updateVisibleCount();
            this.resizeListener = () => this.updateVisibleCount();
            window.addEventListener('resize', this.resizeListener);
            this.startAutoPlay();
        }
    }

    private updateVisibleCount() {
        const width = window.innerWidth;
        if (width <= 768) {
            this.visibleCount.set(1);
        } else if (width <= 1024) {
            this.visibleCount.set(2);
        } else {
            this.visibleCount.set(3);
        }
        // Clamp currentIndex if it's now out of range
        const maxIndex = Math.max(0, this.blogs().length - this.visibleCount());
        if (this.currentIndex() > maxIndex) {
            this.currentIndex.set(0);
        }
    }

    startAutoPlay() {
        this.stopAutoPlay();
        this.carouselInterval = setInterval(() => {
            this.next();
        }, 2000);
    }

    stopAutoPlay() {
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
            this.carouselInterval = null;
        }
    }

    next() {
        const total = this.blogs().length;
        const visible = this.visibleCount();
        if (total === 0) return;
        const maxIndex = total - visible;
        // If at or past the last valid slot, wrap back to 0
        this.currentIndex.update(v => v >= maxIndex ? 0 : v + 1);
    }

    prev() {
        const total = this.blogs().length;
        const visible = this.visibleCount();
        if (total === 0) return;
        const maxIndex = total - visible;
        this.currentIndex.update(v => v <= 0 ? maxIndex : v - 1);
    }

    ngOnDestroy() {
        this.stopAutoPlay();
        if (this.resizeListener && isPlatformBrowser(this.platformId)) {
            window.removeEventListener('resize', this.resizeListener);
        }
        this.currentIndex.set(0);
    }
}
