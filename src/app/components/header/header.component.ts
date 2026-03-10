import { Component, signal, ChangeDetectionStrategy, HostListener, ElementRef, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
    isMenuOpen = signal(false);
    isBlogsOpen = signal(false);
    isComplianceOpen = signal(false);
private elementRef = inject(ElementRef);
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: PointerEvent) {
        // If the click is NOT inside the header component, close everything
        const clickedInside = this.elementRef.nativeElement.contains(event.target);

        if (!clickedInside) {
            this.closeAllMenus();
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
        this.isComplianceOpen.set(false); // Close the other one if this opens
    }

    toggleCompliance(event: Event) {
        event.stopPropagation();
        this.isComplianceOpen.update(open => !open);
    }
}
