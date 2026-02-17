import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FeatureRow {
    name: string;
    cashPositional: string;
    fatafatOptions: string;
    huntingFuture: string;
}

@Component({
    selector: 'app-pricing-plans',
    imports: [RouterLink],
    templateUrl: './pricing-plans.component.html',
    styleUrl: './pricing-plans.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingPlansComponent {
    features = signal<FeatureRow[]>([
        {
            name: 'Ideal For',
            cashPositional: 'Traders who prefer structured and low-noise setups',
            fatafatOptions: 'Active intraday options traders',
            huntingFuture: 'Serious traders seeking frequent opportunities'
        },
        {
            name: 'Trading Focus',
            cashPositional: 'Intraday index options (momentum) and positional stocks',
            fatafatOptions: 'Nifty intraday option buy calls',
            huntingFuture: 'Intraday stocks and index options (buy only)'
        },
        {
            name: 'Capital Required',
            cashPositional: '₹70,000 and above',
            fatafatOptions: '₹50,000 and above',
            huntingFuture: '₹90,000 and above'
        },
        {
            name: 'Trade Frequency',
            cashPositional: '13–16 index trades per month2–3 stock trades per week',
            fatafatOptions: '1–2 intraday trades daily2–3 trades per session',
            huntingFuture: '16–18 trades per month'
        },
        // {
        //     name: 'Price per Month',
        //     cashPositional: 'Contact for pricing',
        //     fatafatOptions: '₹12,000 per month',
        //     huntingFuture: '₹15,000 per month'
        // },
        {
            name: 'Alerts & Support',
            cashPositional: 'Live support during market hours',
            fatafatOptions: 'WhatsApp trade alerts and live support',
            huntingFuture: 'WhatsApp trade alerts and live expert support'
        },
        {
            name: 'Trade Details Provided',
            cashPositional: 'Target and stop-loss for every trade',
            fatafatOptions: 'Clear entry, target, and stop-loss',
            huntingFuture: 'Entry, target, and stop-loss for every setup'
        },
        {
            name: 'Risk Management',
            cashPositional: 'Defined stop-loss on all trades',
            fatafatOptions: 'Strict intraday risk controls',
            huntingFuture: 'Structured risk management framework'
        }
    ]);
}
