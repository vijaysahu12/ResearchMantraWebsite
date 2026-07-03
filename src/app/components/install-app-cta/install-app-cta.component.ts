import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-install-app-cta',
    standalone: true,
    imports: [RouterLink],
    template: `
    <a routerLink="/mobile" class="install-cta"
       aria-label="Install the Research Mantra app — limited offer, 15 days free trial">
      <span class="install-shine" aria-hidden="true"></span>
      <span class="install-badge" aria-hidden="true">FREE</span>
      <span class="install-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2"></rect>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
        </svg>
      </span>
      <span class="install-msg">
        <span class="msg msg-default">Install App · 12 Months FREE*</span>
        <span class="msg msg-hover" aria-hidden="true">🔥 Hurry! Offer ends soon</span>
      </span>
    </a>
  `,
    styles: [`
    .install-cta {
      position: fixed;
      left: -70px;
      top: 58%;
      transform: translateY(-50%) rotate(90deg);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 40%, #10b981 65%, #16a34a 100%);
      background-size: 220% 220%;
      color: #fff;
      border: none;
      border-radius: 0 0 12px 12px;
      font-family: "Inter", system-ui, sans-serif;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      box-shadow: 2px 0 15px rgba(0,0,0,0.22);
      overflow: hidden;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease;
      animation: installPulse 1.8s ease-in-out infinite, installGradient 5s ease infinite;
    }

    @keyframes installGradient {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    /* "FREE" badge chip */
    .install-badge {
      background: #fff;
      color: #16a34a;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1.5px;
      padding: 3px 8px;
      border-radius: 100px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      animation: badgeBlink 1.3s ease-in-out infinite;
    }

    @keyframes badgeBlink {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(0.94); }
    }

    /* Message area: both lines overlaid in one grid cell => fixed size,
       so nothing resizes on hover (no "runaway" flicker). */
    .install-msg {
      display: inline-grid;
      align-items: center;
      justify-items: start;
    }

    .install-msg .msg {
      grid-area: 1 / 1;
      white-space: nowrap;
      line-height: 1;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .msg-hover {
      opacity: 0;
      transform: translateY(6px);
      text-transform: none;
      letter-spacing: 0.3px;
      font-weight: 900;
    }

    .install-cta:hover .msg-default {
      opacity: 0;
      transform: translateY(-6px);
    }

    .install-cta:hover .msg-hover {
      opacity: 1;
      transform: translateY(0);
    }

    .install-cta:hover {
      filter: brightness(1.08);
      box-shadow: 2px 0 26px rgba(0,0,0,0.32), 0 0 26px rgba(34,197,94,0.7);
      animation-play-state: paused;
    }

    .install-cta:hover .install-icon {
      animation: iconBounce 0.6s ease;
    }

    @keyframes iconBounce {
      0%, 100% { transform: rotate(-90deg) scale(1); }
      50% { transform: rotate(-90deg) scale(1.25); }
    }

    .install-cta:focus-visible {
      outline: 3px solid #fff;
      outline-offset: 2px;
    }

    /* Zoom in / zoom out pulse + glow (keeps the 90deg rotation) */
    @keyframes installPulse {
      0%, 100% {
        transform: translateY(-50%) rotate(90deg) scale(1);
        box-shadow: 2px 0 15px rgba(0,0,0,0.22), 0 0 0 rgba(34,197,94,0);
      }
      50% {
        transform: translateY(-50%) rotate(90deg) scale(1.07);
        box-shadow: 2px 0 22px rgba(0,0,0,0.3), 0 0 22px rgba(34,197,94,0.6);
      }
    }

    /* Diagonal light sweep */
    .install-shine {
      position: absolute;
      top: 0;
      left: -60%;
      width: 40%;
      height: 100%;
      background: linear-gradient(100deg, transparent, rgba(255,255,255,0.5), transparent);
      transform: skewX(-20deg);
      animation: installShine 3.4s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes installShine {
      0% { left: -60%; }
      55%, 100% { left: 130%; }
    }

    .install-icon {
      display: flex;
      transform: rotate(-90deg); /* keep the icon upright inside the rotated tab */
    }

    .install-text {
      line-height: 1;
    }

    @keyframes installPulseMobile {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }

    @media (max-width: 768px) {
      .install-cta {
        left: 0;
        top: auto;
        bottom: 150px;
        transform: none;
        flex-direction: column;
        gap: 4px;
        padding: 12px 8px;
        border-radius: 0 8px 8px 0;
        letter-spacing: 0;
        animation: installPulseMobile 1.8s ease-in-out infinite;
      }

      .install-cta:hover {
        left: 0;
      }

      .install-icon {
        transform: none;
      }

      /* Icon + FREE badge only on phones (text would overflow the small tab) */
      .install-msg {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .install-cta,
      .install-shine,
      .install-badge,
      .install-cta:hover .install-icon {
        animation: none;
      }
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InstallAppCtaComponent { }
