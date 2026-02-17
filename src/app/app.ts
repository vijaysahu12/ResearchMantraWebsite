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

    const url = new URL(window.location.href);
    const fromDomain = 'susmitasahoo.in';
    const toDomain = 'researchmantra.in';

    // Allow exact domain or subdomains only
    const isFromDomain =
      url.hostname === fromDomain ||
      url.hostname.endsWith(`.${fromDomain}`);

    if (!isFromDomain) return;

    // Prevent redirect loops
    if (url.hostname === toDomain || url.hostname.endsWith(`.${toDomain}`)) {
      return;
    }

    url.hostname = toDomain;
    window.location.replace(url.toString());
  }

}
