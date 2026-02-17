import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { WhyChooseRmComponent } from './components/why-choose-rm/why-choose-rm.component';
import { PricingPlansComponent } from './components/pricing-plans/pricing-plans.component';
import { AboutSushmitaComponent } from './components/about-sushmita/about-sushmita.component';
import { FaqComponent } from './components/faq/faq.component';
import { TestimonialsComponent } from './components/testimonials/testimonials.component';
import { ContactComponent } from './components/contact/contact.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { RefundPolicyComponent } from './components/refund-policy/refund-policy.component';
import { DisclaimerComponent } from './components/disclaimer/disclaimer.component';
import { DosDontsComponent } from './components/dos-donts/dos-donts.component';
import { InvestorCharterComponent } from './components/investor-charter/investor-charter.component';
import { GrievanceRedressalComponent } from './components/grievance-redressal/grievance-redressal.component';
import { ComplianceAuditComponent } from './components/compliance-audit/compliance-audit.component';
import { ComplaintDataComponent } from './components/complaint-data/complaint-data.component';
import { TermsConditionsComponent } from './components/terms-conditions/terms-conditions.component';
import { BlogsComponent } from './components/blogs/blogs.component';
import { BlogDetailsComponent } from './components/blog-details/blog-details.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'features', component: WhyChooseRmComponent },
    { path: 'pricing', component: PricingPlansComponent },
    { path: 'about', component: AboutSushmitaComponent },
    { path: 'testimonials', component: TestimonialsComponent },
    { path: 'faq', component: FaqComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'complaint-data', component: ComplaintDataComponent },
    { path: 'compliance-audit', component: ComplianceAuditComponent },
    { path: 'grievance-redressal', component: GrievanceRedressalComponent },
    { path: 'investor-charter', component: InvestorCharterComponent },
    { path: 'dos-donts', component: DosDontsComponent },
    { path: 'disclaimer', component: DisclaimerComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: 'refund-policy', component: RefundPolicyComponent },
    { path: 'terms-conditions', component: TermsConditionsComponent },
    { path: 'blogs', component: BlogsComponent },

    // Blog Redirects (Old to New)
    { path: 'top-share-market-advisory-services-india-2025-e', redirectTo: 'best-share-market-advisory-services', pathMatch: 'full' },
    { path: 'best-free-intraday-tips-2025-smart-strategies-safe-practices', redirectTo: 'free-intraday-tips-for-beginners', pathMatch: 'full' },
    { path: 'why-stock-advisory-is-your-edge-in-2025-trends-risks-smart-selection', redirectTo: 'stock-advisory-guide', pathMatch: 'full' },
    { path: 'stock-market-advisory-2025-trends-insights-how-to-choose', redirectTo: 'stock-market-advisory-guide', pathMatch: 'full' },
    { path: 'how-to-choose-a-stock-market-advisory-company-in-2025', redirectTo: 'stock-market-advisory-company-guide', pathMatch: 'full' },
    { path: 'top-share-market-advisory-in-2025-tips-strategic-insights', redirectTo: 'top-share-market-advisory-for-tips-strategic-insights', pathMatch: 'full' },
    { path: 'best-stock-advisory-in-india-2025-key-trends-insights', redirectTo: 'choosing-best-stock-advisory-in-india', pathMatch: 'full' },
    { path: 'top-advisory-company-in-india-2025-insights-trends-and-guid', redirectTo: 'top-advisory-company-in-india-guide', pathMatch: 'full' },
    { path: 'daily-trading-tips-for-2025-trends', redirectTo: 'daily-trading-tips-for-strategies-and-risk-management', pathMatch: 'full' },
    { path: 'best-trading-tips-for-2025-smart-strategies-trends-discipline', redirectTo: 'best-trading-tips', pathMatch: 'full' },
    { path: 'stock-market-tips-2025-proven-strategies-for-smarter-investing', redirectTo: 'top-10-best-stock-market-tips-for-smarter-investing', pathMatch: 'full' },

    // Root-level Blog Detail Catch-all
    { path: 'blog/:slug', redirectTo: ':slug', pathMatch: 'full' },
    { path: ':slug', component: BlogDetailsComponent },

    { path: '**', redirectTo: '' }
];
