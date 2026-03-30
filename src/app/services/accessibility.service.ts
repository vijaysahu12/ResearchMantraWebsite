import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: number; // px value applied to <html> — default 16
}

export const FONT_MIN = 16;
export const FONT_MAX = 24;
export const FONT_STEP = 2;
export const FONT_DEFAULT = 16;

const STORAGE_KEY = 'rm-accessibility';
const DEFAULT: AccessibilitySettings = { highContrast: false, fontSize: FONT_DEFAULT };

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Panel open/close state — shared by header trigger and panel component */
  readonly panelOpen = signal(false);

  readonly settings = signal<AccessibilitySettings>(this.load());

  private load(): AccessibilitySettings {
    if (!this.isBrowser) return { ...DEFAULT };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT };
      const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;

      // Migrate from old string-based fontSize (e.g. 'normal' | 'large' | 'xlarge')
      if (typeof parsed.fontSize === 'string') {
        const legacyMap: Record<string, number> = { normal: 16, large: 18, xlarge: 20 };
        parsed.fontSize = legacyMap[parsed.fontSize as string] ?? FONT_DEFAULT;
      }

      return { ...DEFAULT, ...parsed };
    } catch {
      return { ...DEFAULT };
    }
  }

  private save(s: AccessibilitySettings): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }

  openPanel(): void {
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  toggleHighContrast(): void {
    this.settings.update(s => {
      const next = { ...s, highContrast: !s.highContrast };
      this.save(next);
      return next;
    });
  }

  increaseFontSize(): void {
    this.settings.update(s => {
      if (s.fontSize >= FONT_MAX) return s;
      const next = { ...s, fontSize: s.fontSize + FONT_STEP };
      this.save(next);
      return next;
    });
  }

  decreaseFontSize(): void {
    this.settings.update(s => {
      if (s.fontSize <= FONT_MIN) return s;
      const next = { ...s, fontSize: s.fontSize - FONT_STEP };
      this.save(next);
      return next;
    });
  }
}
