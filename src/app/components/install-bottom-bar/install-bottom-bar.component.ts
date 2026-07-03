import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-install-bottom-bar',
    standalone: true,
    imports: [RouterLink],
    template: `
    @if (visible()) {
      <div class="ibb" role="region" aria-label="Install app offer">
        <div class="ibb-inner">
          <span class="ibb-trust">Trusted by <strong>12K+</strong> Traders</span>
          <span class="ibb-divider" aria-hidden="true"></span>
          <span class="ibb-offer">🔥 <strong>Exclusive Free Trial</strong> — Grab Now</span>
          <a routerLink="/mobile" class="ibb-btn" aria-label="Install the Research Mantra app">
            Install App
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                 stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
        <button type="button" class="ibb-close" (click)="close()" aria-label="Dismiss">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4"
               stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    }
  `,
    styles: [`
    .ibb {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 990;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 11px 52px 11px 20px;
      background: linear-gradient(90deg, #eaf2ff 0%, #dfeaff 50%, #eaf2ff 100%);
      border-top: 1px solid #c7d6f5;
      box-shadow: 0 -6px 20px -8px rgba(15, 23, 42, 0.25);
      font-family: "Inter", system-ui, sans-serif;
      animation: ibbUp 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes ibbUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .ibb-inner {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .ibb-trust {
      font-size: 14.5px;
      font-weight: 600;
      color: #0f172a;
    }

    .ibb-trust strong { font-weight: 800; }

    .ibb-divider {
      width: 1px;
      height: 18px;
      background: #94a3b8;
    }

    .ibb-offer {
      font-size: 14.5px;
      font-weight: 700;
      color: #b45309;
    }

    .ibb-offer strong { font-weight: 900; }

    .ibb-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #f8b018, #ff9500);
      color: #1a1200;
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      text-decoration: none;
      padding: 9px 18px;
      border-radius: 100px;
      box-shadow: 0 8px 18px -6px rgba(248, 176, 24, 0.7);
      animation: ibbPulse 1.9s ease-in-out infinite;
      transition: transform 0.2s ease, filter 0.2s ease;
    }

    .ibb-btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.06);
    }

    .ibb-btn svg { transition: transform 0.2s ease; }
    .ibb-btn:hover svg { transform: translateX(3px); }

    @keyframes ibbPulse {
      0%, 100% { box-shadow: 0 8px 18px -6px rgba(248, 176, 24, 0.55); }
      50% { box-shadow: 0 12px 26px -6px rgba(248, 176, 24, 0.95); }
    }

    .ibb-close {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      display: inline-flex;
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .ibb-close:hover {
      background: rgba(15, 23, 42, 0.08);
      color: #0f172a;
    }

    @media (max-width: 600px) {
      .ibb {
        padding: 10px 44px 10px 14px;
        gap: 8px;
      }

      .ibb-trust,
      .ibb-divider {
        display: none;
      }

      .ibb-offer {
        font-size: 13px;
      }

      .ibb-btn {
        font-size: 13px;
        padding: 8px 14px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ibb,
      .ibb-btn {
        animation: none;
      }
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstallBottomBarComponent {
    visible = signal(true);
    close(): void {
        this.visible.set(false);
    }
}
