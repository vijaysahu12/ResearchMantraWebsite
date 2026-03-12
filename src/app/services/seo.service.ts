import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private readonly document = inject(DOCUMENT);
    private readonly router = inject(Router);
    private readonly titleService = inject(Title);
    private readonly metaService = inject(Meta);

    private readonly baseUrl = 'https://researchmantra.in';

    init() {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.updateCanonicalUrl();
        });
    }

    updateCanonicalUrl(url?: string) {
        const head = this.document.getElementsByTagName('head')[0];
        let element: HTMLLinkElement | null = this.document.querySelector(`link[rel='canonical']`) || null;

        if (!element) {
            element = this.document.createElement('link') as HTMLLinkElement;
            element.setAttribute('rel', 'canonical');
            head.appendChild(element);
        }

        const canonicalUrl = url || (this.baseUrl + this.router.url.split('?')[0].split('#')[0]);
        element.setAttribute('href', canonicalUrl);
    }

    setMetaTags(config: { title?: string, description?: string, keywords?: string, image?: string, type?: string }) {
        // Set og:url to the current canonical URL for proper SEO indexing
        const currentUrl = this.baseUrl + this.router.url.split('?')[0].split('#')[0];
        this.metaService.updateTag({ property: 'og:url', content: currentUrl });

        // Set twitter:card for rich social media previews
        this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

        if (config.title) {
            this.titleService.setTitle(config.title);
            this.metaService.updateTag({ property: 'og:title', content: config.title });
            this.metaService.updateTag({ name: 'twitter:title', content: config.title });
        }

        if (config.description) {
            this.metaService.updateTag({ name: 'description', content: config.description });
            this.metaService.updateTag({ property: 'og:description', content: config.description });
            this.metaService.updateTag({ name: 'twitter:description', content: config.description });
        }

        if (config.keywords) {
            this.metaService.updateTag({ name: 'keywords', content: config.keywords });
        }

        if (config.image) {
            this.metaService.updateTag({ property: 'og:image', content: config.image });
            this.metaService.updateTag({ name: 'twitter:image', content: config.image });
        }

        if (config.type) {
            this.metaService.updateTag({ property: 'og:type', content: config.type });
        } else {
            this.metaService.updateTag({ property: 'og:type', content: 'website' });
        }
    }
}
