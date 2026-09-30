import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Open/closed state for the "Unlock Sudarshan Strategy" modal.
 *
 * The modal's markup lives inside RmIntroComponent, which only renders on the
 * home page, but the top announcement bar that can now open it is site-wide.
 * Holding the flag here lets the bar ask for it from any route: on home it
 * opens straight away, elsewhere we route there first and only flip the flag
 * once that navigation actually succeeds — otherwise the modal would sit armed,
 * waiting to ambush the user the next time they happen to land on the home page.
 */
@Injectable({ providedIn: 'root' })
export class StrategyUnlockService {
    private readonly router = inject(Router);

    /** Bound directly by RmIntroComponent as its `showStrategyModal` signal. */
    readonly isOpen = signal(false);

    /** Open the modal, routing to the home page first if it isn't mounted. */
    requestOpen(): void {
        // Same home test initPortalShell() uses, so the two can't disagree about
        // which URLs render the home page.
        const path = this.router.url.split('?')[0].split('#')[0];

        if (path === '/' || path === '/home') {
            this.isOpen.set(true);
            return;
        }

        this.router.navigate(['/']).then(navigated => {
            if (navigated) this.isOpen.set(true);
        });
    }
}
