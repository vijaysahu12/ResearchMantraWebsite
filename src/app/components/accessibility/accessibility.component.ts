import {
  Component, ChangeDetectionStrategy, inject, computed,
  PLATFORM_ID, ElementRef, viewChild, DOCUMENT, effect
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AccessibilityService, FONT_MIN, FONT_MAX } from '../../services/accessibility.service';

@Component({
  selector: 'app-accessibility',
  templateUrl: './accessibility.component.html',
  styleUrl: './accessibility.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closePanel()'
  }
})
export class AccessibilityComponent {
  protected readonly a11yService = inject(AccessibilityService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly doc = inject(DOCUMENT);

  readonly panelOpen = this.a11yService.panelOpen;
  readonly settings = this.a11yService.settings;
  readonly isHighContrast = computed(() => this.settings().highContrast);
  readonly fontSize = computed(() => this.settings().fontSize);
  readonly fontSizeLabel = computed(() => {
    const pct = Math.round((this.settings().fontSize / 16) * 100);
    return `${pct}%`;
  });

  readonly atMin = computed(() => this.settings().fontSize <= FONT_MIN);
  readonly atMax = computed(() => this.settings().fontSize >= FONT_MAX);

  readonly panelRef = viewChild<ElementRef<HTMLDivElement>>('panel');

  private previousFocus: HTMLElement | null = null;

  constructor() {
    // Manage focus as panel opens / closes
    effect(() => {
      const open = this.a11yService.panelOpen();
      if (!this.isBrowser) return;

      if (open) {
        this.previousFocus = this.doc.activeElement as HTMLElement;
        // Focus first interactive element after @if renders the panel
        setTimeout(() => {
          const panel = this.panelRef()?.nativeElement;
          const first = panel?.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          first?.focus();
        }, 0);
      } else {
        const prev = this.previousFocus;
        this.previousFocus = null;
        setTimeout(() => prev?.focus(), 0);
      }
    });
  }

  closePanel(): void {
    if (!this.panelOpen()) return;
    this.a11yService.closePanel();
  }

  toggleContrast(): void {
    this.a11yService.toggleHighContrast();
  }

  increaseFontSize(): void {
    this.a11yService.increaseFontSize();
  }

  decreaseFontSize(): void {
    this.a11yService.decreaseFontSize();
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length < 2) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.doc.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
