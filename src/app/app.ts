import { Component, signal, ChangeDetectionStrategy, inject, effect, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { EnquiryFormComponent } from './components/enquiry-form/enquiry-form.component';
import { FloatingSocialComponent } from './components/floating-social/floating-social.component';
import { AccessibilityComponent } from './components/accessibility/accessibility.component';
import { SeoService } from './services/seo.service';
import { AccessibilityService } from './services/accessibility.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, EnquiryFormComponent, FloatingSocialComponent, AccessibilityComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('rm-website');
  protected readonly isPortalRoute = signal(false);

  private readonly seoService = inject(SeoService);
  private readonly accessibilityService = inject(AccessibilityService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.handleDomainRedirect();
    this.initPortalShell();
    this.seoService.init();
    this.initAccessibilityEffect();
  }

  private initPortalShell(): void {
    const updateShell = (url: string) => {
      const isPortal = url === '/login' || url.startsWith('/login?') || url.startsWith('/research') || url.startsWith('/share/');
      this.isPortalRoute.set(isPortal);
      if (this.isBrowser) this.document.body.classList.toggle('portal-route', isPortal);
    };

    updateShell(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => updateShell(event.urlAfterRedirects));
  }

  private initAccessibilityEffect(): void {
    effect(() => {
      const { highContrast, fontSize } = this.accessibilityService.settings();
      if (!this.isBrowser) return;

      // High contrast: CSS filter inversion on <body>
      this.document.body.classList.toggle('high-contrast', highContrast);

      // Font size: CSS `zoom` on <html> scales EVERYTHING proportionally —
      // px values, rem, em, images, layout — exactly like browser zoom.
      // This is the only reliable way to scale hardcoded px font-sizes.
      const html = this.document.documentElement;
      if (fontSize === 16) {
        html.style.removeProperty('zoom');
      } else {
        html.style.zoom = String(fontSize / 16);
      }
    });
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
