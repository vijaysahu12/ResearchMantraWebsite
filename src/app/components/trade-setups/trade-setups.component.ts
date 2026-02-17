import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

interface Trade {
    id: number;
    instrument: string;
    gainPct: string;
    type: 'BUY' | 'SELL';
    time: string;
    entry: string;
    target: string;
    sl: string;
    status: 'Active Trade' | 'Target Achieved';
}

@Component({
    selector: 'app-trade-setups',
    templateUrl: './trade-setups.component.html',
    styleUrl: './trade-setups.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradeSetupsComponent {
    trades = signal<Trade[]>([
        {
            id: 1,
            instrument: 'NIFTY 24500 CE',
            gainPct: '+18.9%',
            type: 'BUY',
            time: '10:32 AM',
            entry: '185',
            target: '220',
            sl: '165',
            status: 'Active Trade'
        },
        {
            id: 2,
            instrument: 'RELIANCE',
            gainPct: '+2.6%',
            type: 'BUY',
            time: '11:15 AM',
            entry: '2845.00',
            target: '2920.00',
            sl: '2810.00',
            status: 'Target Achieved'
        },
        {
            id: 3,
            instrument: 'BANKNIFTY 52000 PE',
            gainPct: '+12.2%',
            type: 'BUY',
            time: '12:05 PM',
            entry: '245',
            target: '300',
            sl: '220',
            status: 'Active Trade'
        },
        {
            id: 4,
            instrument: 'TATASTEEL',
            gainPct: '+3.5%',
            type: 'BUY',
            time: '01:30 PM',
            entry: '142',
            target: '148',
            sl: '138',
            status: 'Active Trade'
        }
    ]);
}
