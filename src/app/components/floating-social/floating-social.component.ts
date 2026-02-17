import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-floating-social',
  standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <div class="floating-container">
      @for(social of socials; track social.name) {
        <a [href]="social.link" target="_blank" [attr.aria-label]="social.name" class="social-icon" [style.--glow-color]="social.color">
          <img [ngSrc]="social.icon" [alt]="social.name" width="40" height="40">
        </a>
      }
    </div>
  `,
  styles: [`
    .floating-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      z-index: 1000;
      pointer-events: none;
      animation: slideIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideIn {
      from { transform: translateX(100px) rotate(10deg); opacity: 0; }
      to { transform: translateX(0) rotate(0); opacity: 1; }
    }
    .social-icon {
      pointer-events: auto;
      width: 55px;
      height: 55px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      position: relative;
    }
    .social-icon::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: var(--glow-color);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
      filter: blur(12px);
    }
    .social-icon img {
      width: 32px;
      height: 32px;
      object-fit: contain;
      transition: transform 0.3s ease;
      z-index: 1;
    }
    .social-icon:hover {
      transform: scale(1.15) translateY(-5px);
      background: white;
      border-color: var(--glow-color);
      color: white;
    }
    .social-icon:hover::after {
      opacity: 0.4;
    }
    .social-icon:hover img {
      transform: scale(1.1);
    }
    @media (max-width: 768px) {
      .floating-container {
        bottom: 1.5rem;
        right: 1.5rem;
        gap: 0.8rem;
      }
      .social-icon {
        width: 48px;
        height: 48px;
      }
      .social-icon img {
        width: 28px;
        height: 28px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingSocialComponent {
  socials = [
    { name: 'WhatsApp', icon: 'assets/what.png', link: 'https://wa.me/918341052621', color: '#25D366' },
    { name: 'Telegram', icon: 'assets/telegram_icon.png', link: 'https://t.me/ReasearchMantra', color: '#0088cc' },
    { name: 'Instagram', icon: 'assets/Insta.png', link: 'https://www.instagram.com/research_mantra', color: '#E1306C' },
    { name: 'YouTube', icon: 'assets/You.png', link: 'https://www.youtube.com/@ResearchMantraOfficial', color: '#FF0000' }
  ];
}
