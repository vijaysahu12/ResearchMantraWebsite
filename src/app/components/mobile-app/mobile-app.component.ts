import { Component, ChangeDetectionStrategy, signal, inject, PLATFORM_ID } from '@angular/core';
import { NgOptimizedImage, isPlatformBrowser } from '@angular/common';

interface AppFeature {
    readonly title: string;
    readonly description: string;
    readonly icon: 'bell' | 'chart' | 'trend' | 'tools' | 'news' | 'shield';
}

interface AppScreen {
    readonly src: string;
    readonly alt: string;
    readonly caption: string;
}

@Component({
    selector: 'app-mobile-app',
    imports: [NgOptimizedImage],
    templateUrl: './mobile-app.component.html',
    styleUrl: './mobile-app.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileAppComponent {
    private readonly platformId = inject(PLATFORM_ID);

    readonly playStoreUrl = 'https://play.google.com/store/apps/details?id=com.research_mantra_official';
    readonly appStoreUrl = 'https://apps.apple.com/in/app/research-mantra/id6764504116';

    /**
     * Store link that matches the visitor's device:
     * iOS -> App Store, Android/desktop/web -> Play Store (default).
     * Resolved in the browser only, so it is SSR-safe.
     */
    readonly primaryDownloadUrl = signal(this.playStoreUrl);

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            const ua = navigator.userAgent || '';
            const isIOS = /iPad|iPhone|iPod/.test(ua)
                || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

            if (isIOS) {
                this.primaryDownloadUrl.set(this.appStoreUrl);
            }
        }
    }

    readonly heroPills: readonly string[] = [
        'Live Trade Alerts',
        'Research Reports',
        'Financial Tools',
        'Market Blogs'
    ];

    readonly stats: readonly { value: string; label: string }[] = [
        { value: '4.8★', label: 'App Rating' },
        { value: '5K+', label: 'Downloads' },
        { value: 'SEBI', label: 'Registered' }
    ];

    readonly features: readonly AppFeature[] = [
        {
            title: 'Live Trade Alerts',
            description: 'Real-time entry, target and exit calls with live commentary the moment the market moves.',
            icon: 'bell'
        },
        {
            title: 'Research Reports',
            description: 'Fundamentally researched stock ideas with TTM PE, market cap and detailed analyst notes.',
            icon: 'chart'
        },
        {
            title: 'Trend Frameworks',
            description: 'Nifty Trend, Midcap Trend and Long Term Goal frameworks to plan every kind of trade.',
            icon: 'trend'
        },
        {
            title: 'Financial Tools',
            description: 'SIP, CAGR, risk-reward, loan and retirement calculators to plan your future smartly.',
            icon: 'tools'
        },
        {
            title: 'Market Blogs',
            description: 'Daily pre & post market updates, global cues and curated news right inside the app.',
            icon: 'news'
        },
        {
            title: 'SEBI Registered',
            description: 'Guidance from a SEBI Registered Research Analyst (INH000019150) you can trust.',
            icon: 'shield'
        }
    ];

    readonly screens: readonly AppScreen[] = [
        { src: 'assets/2.png', alt: 'Trend participation frameworks in the app', caption: 'Trend Frameworks' },
        { src: 'assets/3.png', alt: 'Live trade commentary with captured points', caption: 'Live Commentary' },
        { src: 'assets/4.png', alt: 'Fundamental research on stocks', caption: 'Research Stocks' },
        { src: 'assets/5.png', alt: 'Financial calculators and tools', caption: 'Finance Tools' },
        { src: 'assets/6.png', alt: 'Market blogs and news feed', caption: 'Market Blogs' }
    ];
}
