import {
    Component, ChangeDetectionStrategy, signal, inject,
    AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone, PLATFORM_ID
} from '@angular/core';
import { Router } from '@angular/router';
import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';

interface PriceTier {
    label: string;
    price: string;
    highlight?: boolean;
}

interface Plan {
    id: number;
    name: string;
    category: string;
    idealFor: string;
    tradingFocus: string;
    capitalRequired: string;
    tradeFrequency: string;
    alertsSupport: string;
    tradeDetails: string;
    riskManagement: string;
    pricing: PriceTier[];
}

@Component({
    selector: 'app-pricing-plans',
    imports: [NgOptimizedImage],
    templateUrl: './pricing-plans.component.html',
    styleUrl: './pricing-plans.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingPlansComponent implements AfterViewInit, OnDestroy {
    private router = inject(Router);
    private zone = inject(NgZone);
    private platformId = inject(PLATFORM_ID);

    @ViewChild('pinWrap') pinWrap!: ElementRef<HTMLElement>;
    @ViewChild('viewport') viewport!: ElementRef<HTMLElement>;
    @ViewChild('track') track!: ElementRef<HTMLElement>;
    @ViewChild('progressFill') progressFill!: ElementRef<HTMLElement>;

    private pinEnabled = false;
    private scrollDistance = 0;
    private currentX = 0;
    private targetX = 0;
    private raf = 0;
    private cleanup: (() => void) | null = null;

    ngAfterViewInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        this.zone.runOutsideAngular(() => {
            const onScroll = () => this.onScroll();
            const onResize = () => this.measure();

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onResize);
            window.addEventListener('load', onResize);

            // Recompute once images/fonts have settled the layout width.
            setTimeout(() => this.measure(), 300);

            this.cleanup = () => {
                window.removeEventListener('scroll', onScroll);
                window.removeEventListener('resize', onResize);
                window.removeEventListener('load', onResize);
                if (this.raf) cancelAnimationFrame(this.raf);
            };
        });
    }

    ngOnDestroy(): void {
        this.cleanup?.();
    }

    /** Measure overflow and decide whether the pin effect should be active. */
    private measure(): void {
        const wrap = this.pinWrap?.nativeElement;
        const view = this.viewport?.nativeElement;
        const track = this.track?.nativeElement;
        if (!wrap || !view || !track) return;

        const wide = window.innerWidth > 900;
        const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
        this.scrollDistance = Math.max(0, track.scrollWidth - view.clientWidth);
        this.pinEnabled = wide && motionOk && this.scrollDistance > 0;

        if (this.pinEnabled) {
            wrap.classList.add('pin-on');
            // Tall spacer = one screen to view + the horizontal distance to travel.
            wrap.style.height = `${window.innerHeight + this.scrollDistance}px`;
            this.onScroll();
        } else {
            wrap.classList.remove('pin-on');
            wrap.style.height = '';
            track.style.transform = '';
            this.currentX = this.targetX = 0;
            if (this.progressFill) this.progressFill.nativeElement.style.width = '0%';
        }
    }

    private onScroll(): void {
        if (!this.pinEnabled) return;
        const rect = this.pinWrap.nativeElement.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, -rect.top / this.scrollDistance));

        this.targetX = -progress * this.scrollDistance;
        if (this.progressFill) {
            this.progressFill.nativeElement.style.width = `${progress * 100}%`;
        }
        if (!this.raf) this.raf = requestAnimationFrame(this.animate);
    }

    /** Ease the track toward the scroll-derived target for a smooth glide. */
    private animate = (): void => {
        const diff = this.targetX - this.currentX;
        if (Math.abs(diff) < 0.5) {
            this.currentX = this.targetX;
        } else {
            this.currentX += diff * 0.16;
        }
        this.track.nativeElement.style.transform = `translate3d(${this.currentX}px, 0, 0)`;

        if (this.currentX !== this.targetX) {
            this.raf = requestAnimationFrame(this.animate);
        } else {
            this.raf = 0;
        }
    };

    /** Arrow buttons: nudge by one card either via page scroll (pinned) or native scroll (fallback). */
    nudge(dir: number): void {
        const track = this.track?.nativeElement;
        const first = track?.firstElementChild as HTMLElement | null;
        const step = first ? first.offsetWidth + 22 : 340;

        if (this.pinEnabled) {
            window.scrollBy({ top: dir * step, behavior: 'smooth' });
        } else {
            this.viewport?.nativeElement.scrollBy({ left: dir * step, behavior: 'smooth' });
        }
    }

    scrollToContact(event: Event): void {
        event.preventDefault();
        const scroll = () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        if (this.router.url === '/') {
            scroll();
        } else {
            this.router.navigate(['/']).then(() => setTimeout(scroll, 100));
        }
    }

    isModalOpen = signal(false);

    openReportModal() {
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
    }

    private readonly ALERTS = 'Research Mantra application';
    private readonly TRADE_DETAILS = 'Clear entry, exit, target, stop-loss & reason of entry';

    plans = signal<Plan[]>([
        {
            id: 1,
            name: 'Dhan Setu',
            category: 'Intraday Index Options',
            idealFor: 'Active intraday options traders',
            tradingFocus: 'Intraday index option buy calls',
            capitalRequired: '₹30,000 – ₹50,000 & above',
            tradeFrequency: '1–2 intraday trades daily',
            alertsSupport: this.ALERTS,
            tradeDetails: this.TRADE_DETAILS,
            riskManagement: 'Strict intraday risk controls',
            pricing: [
                { label: '3 Months', price: '999' },
                { label: '6 Months', price: '1,599' },
                { label: '12 Months', price: '3,000', highlight: true }
            ]
        },
        {
            id: 2,
            name: 'Trend Tracker',
            category: 'Intraday Stock Options',
            idealFor: 'Active intraday options traders',
            tradingFocus: 'Intraday stock option buy calls',
            capitalRequired: '₹50,000 & above',
            tradeFrequency: '1–2 intraday trades daily',
            alertsSupport: this.ALERTS,
            tradeDetails: this.TRADE_DETAILS,
            riskManagement: 'Strict intraday risk controls',
            pricing: [
                { label: '3 Months', price: '999' },
                { label: '6 Months', price: '1,599' },
                { label: '12 Months', price: '3,000', highlight: true }
            ]
        },
        {
            id: 3,
            name: 'Nifty Trend',
            category: 'Positional Futures',
            idealFor: 'Active positional future traders',
            tradingFocus: 'Positional Nifty future trade only',
            capitalRequired: '₹2,50,000 & above',
            tradeFrequency: 'Intraday or positional trade',
            alertsSupport: this.ALERTS,
            tradeDetails: this.TRADE_DETAILS,
            riskManagement: 'Strict risk controls',
            pricing: [
                { label: '3 Months', price: '1,000' },
                { label: '6 Months', price: '1,599' },
                { label: '12 Months', price: '2,999', highlight: true }
            ]
        },
        {
            id: 4,
            name: 'Midcap Trend',
            category: 'Positional Futures',
            idealFor: 'Active positional future traders',
            tradingFocus: 'Positional Midcap future trade only',
            capitalRequired: '₹3,00,000 & above',
            tradeFrequency: 'Intraday or positional trade',
            alertsSupport: this.ALERTS,
            tradeDetails: this.TRADE_DETAILS,
            riskManagement: 'Strict risk controls',
            pricing: [
                { label: '3 Months', price: '1,000' },
                { label: '6 Months', price: '1,599' },
                { label: '12 Months', price: '2,999', highlight: true }
            ]
        },
        {
            id: 5,
            name: 'Long Term Goal Oriented',
            category: 'Swing & Long-Term Equity',
            idealFor: 'Active swing and long-term traders',
            tradingFocus: 'Swing & long-term equity trade only',
            capitalRequired: '₹1,00,000 & above',
            tradeFrequency: 'Swing and long-term trade',
            alertsSupport: this.ALERTS,
            tradeDetails: this.TRADE_DETAILS,
            riskManagement: 'Strict risk controls',
            pricing: [
                { label: '3 Months', price: '1,499' },
                { label: '6 Months', price: '1,998' },
                { label: '12 Months', price: '3,500', highlight: true }
            ]
        },
        {
            id: 6,
            name: 'MCX Metals Pro',
            category: 'Commodity',
            idealFor: 'Active commodity traders',
            tradingFocus: 'Crude oil, natural gas, zinc & other base metals',
            capitalRequired: '₹2,50,000 & above',
            tradeFrequency: 'Intraday or positional trade',
            alertsSupport: this.ALERTS,
            tradeDetails: this.TRADE_DETAILS,
            riskManagement: 'Strict risk controls',
            pricing: [
                { label: '3 Months', price: '1,199' },
                { label: '6 Months', price: '1,600' },
                { label: '12 Months', price: '2,601', highlight: true }
            ]
        },
        {
            id: 7,
            name: 'MCX Bullion Pro',
            category: 'Commodity',
            idealFor: 'Active commodity traders',
            tradingFocus: 'Gold and silver trades',
            capitalRequired: '₹4,00,000 & above',
            tradeFrequency: 'Intraday or positional trade',
            alertsSupport: this.ALERTS,
            tradeDetails: this.TRADE_DETAILS,
            riskManagement: 'Strict risk controls',
            pricing: [
                { label: '3 Months', price: '1,199' },
                { label: '6 Months', price: '1,600' },
                { label: '12 Months', price: '2,601', highlight: true }
            ]
        }
    ]);
}
