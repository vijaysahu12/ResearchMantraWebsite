import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FaqItem {
    id: number;
    question: string;
    answer: string;
}

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './faq.component.html',
    styleUrl: './faq.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqComponent {
    expandedItemId = signal<number | null>(null);

    faqs = signal<FaqItem[]>([
        {
            id: 1,
            question: 'What is Research Mantra and how does it work?',
            answer: 'Research Mantra is a SEBI-registered investment advisory service that provides research-backed trade ideas across Intraday, F&O, Stocks, MCX, and long-term investments. We share daily trade recommendations with clear entry, target, and stop-loss levels through our app'
        },
        {
            id: 2,
            question: 'Is Research Mantra SEBI registered?',
            answer: 'Yes, Research Mantra is registered with SEBI (Securities and Exchange Board of India) as a Research Analyst under registration number INH000019150. You can verify this on the SEBI website.'
        },
        {
            id: 3,
            question: 'What kind of trade ideas do you provide?',
            answer: 'We provide trade ideas across multiple segments: Intraday (2-3 daily), Futures & Options, Stock investments for medium to long-term, MCX commodities, and weekly portfolio picks. Each idea comes with detailed analysis, entry levels, targets, and stop-loss.'
        },
        {
            id: 4,
            question: 'How will I receive the trade recommendations?',
            answer: 'You\'ll receive all trade ideas through our mobile app (available on Android and iOS) with instant push notifications. We also send SMS alerts for time-sensitive trades. Premium members get WhatsApp support as well.'
        },
        {
            id: 5,
            question: 'What is your success/accuracy rate?',
            answer: 'Our historical accuracy rate is approximately 85% across all segments. However, we always recommend proper risk management as past performance doesn\'t guarantee future results. Every trade carries inherent market risk.'
        },
        {
            id: 6,
            question: 'Can I try before I subscribe?',
            answer: 'Absolutely! We offer 3 free trade ideas when you sign up with your mobile number. This helps you experience our research quality before committing to a paid plan.'
        },
        {
            id: 7,
            question: 'What if I\'m a complete beginner?',
            answer: 'Our Starter plan is designed for beginners. We provide not just trade ideas, but also educational content explaining the reasoning behind each recommendation. This helps you learn while you earn.'
        },
        {
            id: 8,
            question: 'Can I cancel my subscription anytime?',
            answer: 'Yes, all our plans are flexible with no long-term lock-ins. You can cancel anytime from your app settings. Refunds are processed as per our refund policy available in the terms of service.'
        },
        {
            id: 9,
            question: 'What is investment advisory, and how can it help me?',
            answer: 'Investment advisory guides you with expert-backed strategies for long-term and short-term investments, helping you grow wealth with proper risk management and market research.'
        },
        {
            id: 10,
            question: 'What do your Investment Advisory Services include?',
            answer: 'My investment advisory services include equity research, portfolio planning, option strategies, and real-time insights tailored to your financial goals.'
        },
        {
            id: 11,
            question: 'What makes investment advisor services valuable for beginners?',
            answer: 'Investment advisor services help beginners avoid common mistakes by offering structured guidance, risk-managed strategies, and easy investment plans according to their financial goals.'
        },
        {
            id: 12,
            question: 'Why should I choose the best investment advisor services?',
            answer: 'You should choose the best investment advisor services, as your investments fit with your risk profile, supported by data-driven analysis from a SEBI-registered research analyst.'
        },
        {
            id: 13,
            question: 'How does a stock market advisor support traders?',
            answer: 'A stock market advisor provides research-backed calls, market updates, and personalized strategies to help traders make confident and profitable decisions.'
        },
        {
            id: 14,
            question: 'What is included in your Stock Market Advisory service?',
            answer: 'Stock market advisory includes equity analysis, options setup, risk management guidance, and daily/weekly market insights, all designed to build and increase your trading confidence.'
        },
        {
            id: 15,
            question: 'Are your intraday tips beginner-friendly?',
            answer: 'Yes, all intraday tips come with entry, target, SL, and risk-reward ratios, making them easy to follow for both beginners and experienced traders.'
        },
        {
            id: 16,
            question: 'What type of stock trading tips do you provide?',
            answer: 'I share stock trading tips, including intraday, swing, positional, and options-based tips with clear entry, exit, target, and stop-loss for safe and disciplined trading'
        },
        {
            id: 17,
            question: 'What does stock market consultancy offer?',
            answer: 'Stock market consultancy provides portfolio audits, risk profiling, strategy creation, and performance tracking to optimize your trading and investment results.'
        },
        {
            id: 18,
            question: 'How can I connect with a stock market advisor near me?',
            answer: 'You can connect with a stock market advisor near me instantly online via WhatsApp, calls, or video sessions; distance doesn’t matter when expert guidance is just one click away, just like Research Mantra.'
        }
    ]);

    toggleItem(id: number) {
        this.expandedItemId.update(currentId => currentId === id ? null : id);
    }
}
