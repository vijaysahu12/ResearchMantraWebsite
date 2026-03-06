import { Component, ChangeDetectionStrategy, inject, signal, effect, OnDestroy, PLATFORM_ID } from '@angular/core';
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
                <p class="section-subtitle">Must read for investors. Learn, invest & earn with us.</p>
            </div>
            <div class="read-more-wrapper">
                <a routerLink="/blogs" class="read-more-link">Read More &rarr;</a>
            </div>
        </div>

        <div class="carousel-container" (mouseenter)="stopAutoPlay()" (mouseleave)="startAutoPlay()">
            <div class="carousel-track" [style.transform]="'translateX(-' + (currentIndex() * (100 / 3)) + '%)'">
                @for (blog of blogs(); track blog.id) {
                <div class="blog-card-wrapper">
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
    // blogs = this.blogService.loadBlogs();
    currentIndex = signal(0);
    private carouselInterval: any;

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        this.carouselInterval = setInterval(() => {
            this.next();
        }, 2000);
    }

    stopAutoPlay() {
        if (this.carouselInterval) {
            clearInterval(this.carouselInterval);
        }
    }

    next() {
        const total = this.blogs().length;
        if (total === 0) return;
        this.currentIndex.update(v => (v + 1) % total);
    }

    prev() {
        const total = this.blogs().length;
        if (total === 0) return;
        this.currentIndex.update(v => (v - 1 + total) % total);
    }

    ngOnDestroy() {
        this.stopAutoPlay();
    }
}
