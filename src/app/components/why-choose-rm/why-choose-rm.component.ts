import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

interface Feature {
    id: number;
    title: string;
    description: string;
}

@Component({
    selector: 'app-why-choose-rm',
    templateUrl: './why-choose-rm.component.html',
    styleUrl: './why-choose-rm.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WhyChooseRmComponent {
    features = signal<Feature[]>([
        {
            id: 1,
            title: 'Clear Entry & Exit Levels',
            description: 'Every trade idea comes with precise entry, target, and stop-loss levels. No ambiguity, just actionable insights.'
        },
        {
            id: 2,
            title: 'Multi-Segment Coverage',
            description: 'Get ideas across Intraday, F&O, Stocks, MCX, and long-term investments. One subscription, complete coverage.'
        },
        {
            id: 3,
            title: 'Real-Time Alerts',
            description: 'Instant notifications via app and SMS. Never miss a trade opportunity with our timely alerts.'
        },
        {
            id: 4,
            title: 'Research-Backed Analysis',
            description: 'Every recommendation is backed by thorough technical and fundamental analysis. Understand the why behind each trade.'
        },
        {
            id: 5,
            title: 'Risk Management Focus',
            description: 'Defined risk per trade with proper position sizing guidance. Protect your capital while maximizing returns.'
        },
        {
            id: 6,
            title: 'Discipline-First Approach',
            description: 'We follow a systematic process. No emotional trading, no tips culture—just structured, research-driven ideas.'
        }
    ]);
}
