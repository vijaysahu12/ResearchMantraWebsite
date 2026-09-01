import { isPlatformBrowser, DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Component, signal, computed, ChangeDetectionStrategy, inject, effect, PLATFORM_ID, DestroyRef } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { EnquiryFormComponent } from './components/enquiry-form/enquiry-form.component';
import { FloatingSocialComponent } from './components/floating-social/floating-social.component';
import { AccessibilityComponent } from './components/accessibility/accessibility.component';
import { InstallBottomBarComponent } from './components/install-bottom-bar/install-bottom-bar.component';
import { FreeTrialDialogComponent } from './components/free-trial-dialog/free-trial-dialog.component';
import { RouterLink } from '@angular/router';
import { SeoService } from './services/seo.service';
import { AccessibilityService } from './services/accessibility.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Clarity from '@microsoft/clarity';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, HeaderComponent, FooterComponent, EnquiryFormComponent, FloatingSocialComponent, AccessibilityComponent, InstallBottomBarComponent, FreeTrialDialogComponent, NgOptimizedImage],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class App {
  protected readonly title = signal('rm-website');
  readonly isPromoOpen = signal(false);
  protected readonly isPortalRoute = signal(false);
  /** Hide the top bars (promo + header) when scrolling down, reveal on scroll up. */
  protected readonly topBarsHidden = signal(false);
  private lastScrollY = 0;

  // Rotating campaigns shown in the site-wide top announcement bar
  protected readonly topPromoCampaigns: Array<{ pre: string; bold: string; post: string; cta: string; link: string; returnUrl?: string; theme: 'trial' | 'gold' | 'green' }> = [
    { pre: 'Grab your ', bold: 'Exclusive Free Trial', post: ' on the Research Mantra App', cta: 'Install Now', link: '/mobile', theme: 'trial' },
  ];
  protected readonly activeTopPromoIndex = signal(0);
  protected readonly activeTopPromo = computed(() => this.topPromoCampaigns[this.activeTopPromoIndex()]);
  private topPromoTimer: ReturnType<typeof setInterval> | null = null;

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
    this.schedulePromoPopup();
    this.startTopPromoRotation();
    this.initClarity();
  }

  private initClarity(): void {
    if (!this.isBrowser || !environment.production) return;
    Clarity.init('y32b0yanv1');
  }

  closePromo(): void {
    this.isPromoOpen.set(false);
  }

  protected onWindowScroll(): void {
    if (!this.isBrowser) return;
    const y = window.scrollY;
    const delta = y - this.lastScrollY;

    // Always show near the very top; otherwise hide on downward scroll and
    // reveal on upward scroll (small deltas ignored to avoid jitter).
    if (y < 140) {
      this.topBarsHidden.set(false);
    } else if (delta > 6) {
      this.topBarsHidden.set(true);
    } else if (delta < -6) {
      this.topBarsHidden.set(false);
    }

    this.lastScrollY = y;
  }

  private schedulePromoPopup(): void {
    if (!this.isBrowser) return;
    // Show on every page load / refresh, 7s after load.
    setTimeout(() => {
      this.isPromoOpen.set(true);
    }, 7000);
  }

  /** Cycle the top announcement bar through Free Trial / bundle / combo campaigns. */
  private startTopPromoRotation(): void {
    if (!this.isBrowser) return;
    this.topPromoTimer = setInterval(() => {
      this.activeTopPromoIndex.update(i => (i + 1) % this.topPromoCampaigns.length);
    }, 4500);
    this.destroyRef.onDestroy(() => { if (this.topPromoTimer) clearInterval(this.topPromoTimer); });
  }

  private initPortalShell(): void {
    const updateShell = (url: string) => {
      const path = url.split('?')[0].split('#')[0];
      const isPortal = url === '/login' || url.startsWith('/login?') || url.startsWith('/research') || url.startsWith('/share/');
      const isHome = !isPortal && (path === '/' || path === '/home');
      this.isPortalRoute.set(isPortal);
      // Toggle on both server and browser so SSR markup matches the client
      // shell (prevents a layout shift on the home page during hydration).
      this.document.body.classList.toggle('portal-route', isPortal);
      this.document.body.classList.toggle('home-route', isHome);
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
