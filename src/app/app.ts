import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { EnquiryFormComponent } from './components/enquiry-form/enquiry-form.component';
import { FloatingSocialComponent } from './components/floating-social/floating-social.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, EnquiryFormComponent, FloatingSocialComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('rm-website');

  constructor() {
    this.handleDomainRedirect();
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
