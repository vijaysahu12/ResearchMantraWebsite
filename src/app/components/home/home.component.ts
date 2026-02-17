import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RmIntroComponent } from '../rm-intro/rm-intro.component';
import { TradeSetupsComponent } from '../trade-setups/trade-setups.component';
import { WhyChooseRmComponent } from '../why-choose-rm/why-choose-rm.component';
import { PricingPlansComponent } from '../pricing-plans/pricing-plans.component';
import { AboutSushmitaComponent } from '../about-sushmita/about-sushmita.component';
import { TestimonialsComponent } from '../testimonials/testimonials.component';
import { FaqComponent } from '../faq/faq.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RmIntroComponent,
    TradeSetupsComponent,
    WhyChooseRmComponent,
    PricingPlansComponent,
    AboutSushmitaComponent,
    TestimonialsComponent,
    FaqComponent
  ],
  template: `
    <app-rm-intro></app-rm-intro>
    <app-trade-setups></app-trade-setups>
    <app-why-choose-rm></app-why-choose-rm>
    <app-pricing-plans></app-pricing-plans>
    <app-about-sushmita></app-about-sushmita>
    <app-testimonials></app-testimonials>
    <app-faq></app-faq>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private titleService = inject(Title);
  private metaService = inject(Meta);

  ngOnInit() {
    this.titleService.setTitle('Research Mantra is Led by Susmita Sahoo, a SEBI Registered Research Analyst');
    this.metaService.updateTag({ name: 'description', content: 'Research Mantra, directed by Susmita Sahoo, a SEBI Registered Research Analyst, offers professional stock analysis, investment research, and advisory services.' });
    this.metaService.updateTag({ name: 'keywords', content: 'SEBI Registered Research Analyst' });

    // OG Tags
    this.metaService.updateTag({ property: 'og:title', content: 'Research Mantra is Led by Susmita Sahoo, a SEBI Registered Research Analyst' });
    this.metaService.updateTag({ property: 'og:description', content: 'Research Mantra, directed by Susmita Sahoo, a SEBI Registered Research Analyst, offers professional stock analysis, investment research, and advisory services.' });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
  }
}
