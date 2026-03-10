import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { EnquiryFormComponent } from './components/enquiry-form/enquiry-form.component';
import { FloatingSocialComponent } from './components/floating-social/floating-social.component';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, EnquiryFormComponent, FloatingSocialComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('rm-website');

  private readonly seoService = inject(SeoService);

  constructor() {
    this.handleDomainRedirect();
    this.seoService.init();
  }


  private handleDomainRedirect(): void {
    if (typeof window === 'undefined') return;

    // Direct check for the old domain string
    if (window.location.hostname.includes('susmitasahoo.in')) {
      const url = new URL(window.location.href);
      url.hostname = 'researchmantra.in';
      url.protocol = 'https:'; // Ensures the final destination is always secure
      window.location.replace(url.toString());
    }
  }

}
