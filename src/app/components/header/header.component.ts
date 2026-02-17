import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

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
    isComplianceOpen = signal(false);

    toggleMenu() {
        this.isMenuOpen.update(open => !open);
        if (!this.isMenuOpen()) {
            this.isComplianceOpen.set(false);
        }
    }

    toggleCompliance(event: Event) {
        event.stopPropagation();
        this.isComplianceOpen.update(open => !open);
    }
}
