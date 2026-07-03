import { Component, ChangeDetectionStrategy, signal, ElementRef, inject, AfterViewInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FeatureSection {
    id: number;
    title: string;
    image: string;
    items: string[];
}

@Component({
    selector: 'app-trade-setups',
    imports: [CommonModule],
    templateUrl: './trade-setups.component.html',
    styleUrl: './trade-setups.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradeSetupsComponent implements AfterViewInit, OnDestroy {
    private el = inject(ElementRef);
    private cdr = inject(ChangeDetectorRef);
    private zone = inject(NgZone);
    private observer: IntersectionObserver | null = null;

    activeIndex = signal<number>(0);

    sections = signal<FeatureSection[]>([
        {
            id: 0,
            title: 'Build your portfolio',
            image: 'assets/1.png',
            items: [
                "Research Mantra brings market research, live trade commentary, and practical finance tools into one simple app. Get real-time trade alerts, curated research reports, and calculators that help you plan SIPs, loans, and goals — all in an intuitive mobile experience."
            ]
        },
        {
            id: 1,
            title: 'Invest wisely',
            image: 'assets/2.png',
            items: [
                "Trend Frameworks — Nifty, Midcap, Commodities strategies."
            ]
        },
        {
            id: 2,
            title: 'Financial goal',
            image: 'assets/3.png',
            items: [
                "Live Trades & Playbooks — step-by-step signals and live commentary."
            ]
        },
        {
            id: 3,
            title: 'Market dynamics',
            image: 'assets/4.png',
            items: [
                "Research Reports — quick company overviews and performance metrics."
            ]
        },
        {
            id: 4,
            title: 'Short term gain',
            image: 'assets/5.png',
            items: [
                "Finance Tools — SIP, CAGR, EMI, lump-sum, retirement & more."
            ]
        }, {
            id: 5,
            title: 'Connect, Share & Engage',
            image: 'assets/6.png',
            items: [
                "Share your thoughts, post updates, and connect with other users."
            ]
        }
    ]);

    ngAfterViewInit() {
        // Run outside Angular to avoid unnecessary change detection cycles from scrolling
        // but manually detect changes when we actually switch index
        this.zone.runOutsideAngular(() => {
            setTimeout(() => this.setupObserver(), 200);
        });
    }

    private setupObserver() {
        if (typeof window === 'undefined') return;

        const options = {
            root: null, // use viewport
            rootMargin: '0px',
            threshold: 0.5 // Trigger when half of the text block is visible
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                    const newIndex = Number(entry.target.getAttribute('data-index'));
                    if (this.activeIndex() !== newIndex) {
                        this.zone.run(() => {
                            this.activeIndex.set(newIndex);
                            this.cdr.markForCheck();
                        });
                    }
                }
            });
        }, options);

        const targets = this.el.nativeElement.querySelectorAll('.feature-block');
        targets.forEach((target: HTMLElement) => {
            this.observer?.observe(target);
        });
    }

    ngOnDestroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}
