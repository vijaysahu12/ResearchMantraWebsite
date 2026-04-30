import { Component, signal, ChangeDetectionStrategy, ElementRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
    selector: 'app-header',
    imports: [RouterLink],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '(document:click)': 'onDocumentClick($event)'
    }
})
export class HeaderComponent {
    isMenuOpen = signal(false);
    isBlogsOpen = signal(false);
    isComplianceOpen = signal(false);
    private elementRef = inject(ElementRef);
    private readonly a11yService = inject(AccessibilityService);
    private readonly router = inject(Router);

    openAccessibilityPanel(): void {
        this.a11yService.openPanel();
    }

    onDocumentClick(event: PointerEvent) {
        const clickedInside = this.elementRef.nativeElement.contains(event.target);
        if (!clickedInside) {
            this.closeAllMenus();
        }
    }

    scrollToSection(event: Event, sectionId: string): void {
        event.preventDefault();
        this.isMenuOpen.set(false);

        const scroll = () => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        };

        if (this.router.url === '/') {
            scroll();
        } else {
            this.router.navigate(['/']).then(() => setTimeout(scroll, 100));
        }
    }

    private closeAllMenus() {
        this.isMenuOpen.set(false);
        this.isBlogsOpen.set(false);
        this.isComplianceOpen.set(false);
    }

    toggleMenu() {
        this.isMenuOpen.update(open => !open);
        if (!this.isMenuOpen()) {
            this.isComplianceOpen.set(false);
        }
    }

    toggleBlogs(event: Event) {
        event.stopPropagation();
        this.isBlogsOpen.update(open => !open);
        this.isComplianceOpen.set(false);
    }

    toggleCompliance(event: Event) {
        event.stopPropagation();
        this.isComplianceOpen.update(open => !open);
    }
}
