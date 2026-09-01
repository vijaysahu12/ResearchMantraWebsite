import {
    Component, ChangeDetectionStrategy, signal, inject,
    AfterViewInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Testimonial {
    id: number;
    name: string;
    role: string;
    // location: string;
    initial: string;
    rating: number;
    text: string;
}

@Component({
    selector: 'app-testimonials',
    standalone: true,
    templateUrl: './testimonials.component.html',
    styleUrl: './testimonials.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestimonialsComponent implements AfterViewInit, OnDestroy {
    private platformId = inject(PLATFORM_ID);
    private observer: IntersectionObserver | null = null;
    private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    @ViewChild('grid') grid!: ElementRef<HTMLElement>;

    ngAfterViewInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const el = this.grid?.nativeElement;
        const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

        // If we can't animate safely, leave the cards fully visible (no hiding).
        if (!el || !motionOk || typeof IntersectionObserver === 'undefined') {
            return;
        }

        // Direct DOM class toggles — independent of change detection, so the
        // cards can never get stuck hidden.
        el.classList.add('js-anim');

        try {
            this.observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.reveal(el);
                        break;
                    }
                }
            }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

            this.observer.observe(el);
        } catch {
            this.reveal(el);
        }

        // Safety net: never let the cards stay hidden, even if the observer misses.
        this.fallbackTimer = setTimeout(() => this.reveal(el), 1500);
    }

    private reveal(el: HTMLElement): void {
        el.classList.add('in-view');
        this.observer?.disconnect();
        this.observer = null;
        if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
        }
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
    }

    testimonials = signal<Testimonial[]>([
        {
            id: 1,
            name: 'Rajesh Kumar',
            role: 'ProfessionalTrader',
            // location: 'Mumbai',
            initial: 'R',
            rating: 5,
            text: 'The intraday calls are extremely precise. What i like most is the discipline Sushmita ma\'am teaches regarding stop-losses.'
        },
        {
            id: 2,
            name: 'Amit Verma',
            role: 'Investor',
            // location: 'Bangalore',
            initial: 'A',
            rating: 5,
            text: 'I\'ve recovered my past losses using thw swing trading strategies. The analysis is always logic-based, not just guesses.'
        },
        {
            id: 3,
            name: 'Sneha Reddy',
            role: 'Software Engineer',
            // location: 'Delhi',
            initial: 'S',
            rating: 5,
            text: 'Very professional setup.The customer support is responsive, and the premium report is worth every penny.'
        }
        // {
        //     id: 4,
        //     name: 'Suresh Iyer',
        //     role: 'Investor',
        //     location: 'Chennai',
        //     initial: 'S',
        //     rating: 5,
        //     text: 'I appreciate the "why" behind every trade. They don\'t just give tips; they teach you how to analyze the market and trade with confidence.'
        // },
        // {
        //     id: 5,
        //     name: 'Vikram Singh',
        //     role: 'Swing Trader',
        //     location: 'Jaipur',
        //     initial: 'V',
        //     rating: 5,
        //     text: 'Position sizing was my biggest weakness. Sushmita\'s focus on capital protection helped me stay disciplined during volatile sessions.'
        // },
        // {
        //     id: 6,
        //     name: 'Neha Gupta',
        //     role: 'Intermediate Trader',
        //     location: 'Pune',
        //     initial: 'N',
        //     rating: 5,
        //     text: 'Structured, transparent, and research-backed. It\'s hard to find such integrity in the fintech space today. A true value proposition.'
        // }
    ]);
}
