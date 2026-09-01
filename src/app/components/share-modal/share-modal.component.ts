import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
} from '@angular/core';

interface SharePlatform {
  id: string;
  label: string;
  bg: string;
  svgPath: string;
  strokeIcon: boolean;
  getUrl: (url: string, title: string) => string;
}

@Component({
  selector: 'app-share-modal',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      (click)="onOverlayClick($event)"
    >
      <div class="share-card">
        <button class="close-btn" type="button" (click)="close()" aria-label="Close share dialog">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Header -->
        <div class="share-header">
          <div class="share-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </div>
          <h2 id="share-modal-title" class="share-title">Share This Article</h2>
          @if (shareTitle()) {
            <p class="share-article-name">{{ shareTitle() }}</p>
          }
        </div>

        <!-- Copy Link -->
        <div class="copy-section">
          <p class="section-label">Copy link</p>
          <div class="copy-row">
            <div class="copy-url" [title]="shareUrl()">{{ shareUrl() }}</div>
            <button
              type="button"
              class="copy-btn"
              [class.copied]="linkCopied()"
              (click)="copyLink()"
              [attr.aria-label]="linkCopied() ? 'Link copied' : 'Copy link'"
            >
              @if (linkCopied()) {
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Copied!
              } @else {
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              }
            </button>
          </div>
        </div>

        <!-- Share via platforms -->
        <div class="platforms-section">
          <p class="section-label">Share via</p>
          <div class="platforms-grid">
            @for (p of platforms; track p.id) {
              <a
                [href]="p.getUrl(shareUrl(), shareTitle())"
                target="_blank"
                rel="noopener noreferrer"
                class="platform-btn"
                [attr.aria-label]="'Share on ' + p.label"
              >
                <span class="platform-icon" [style.background]="p.bg">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    [attr.fill]="p.strokeIcon ? 'none' : 'white'"
                    [attr.stroke]="p.strokeIcon ? 'white' : 'none'"
                    stroke-width="2"
                  >
                    <path [attr.d]="p.svgPath"></path>
                  </svg>
                </span>
                <span class="platform-label">{{ p.label }}</span>
              </a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .share-card {
      background: #ffffff;
      border-radius: 24px;
      padding: 40px 36px 32px;
      width: 100%;
      max-width: 480px;
      position: relative;
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }

    .close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: rotate(90deg);
    }

    .share-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .share-header-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      color: #fff;
      box-shadow: 0 8px 20px -4px rgba(30, 58, 138, 0.35);
    }

    .share-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }

    .share-article-name {
      font-size: 13px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #94a3b8;
      margin: 0 0 10px;
    }

    .copy-section {
      margin-bottom: 28px;
    }

    .copy-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 4px 4px 4px 14px;
      transition: border-color 0.2s;
    }

    .copy-row:focus-within {
      border-color: #1e3a8a;
    }

    .copy-url {
      flex: 1;
      font-size: 12.5px;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: 'SF Mono', 'Fira Code', monospace;
      min-width: 0;
    }

    .copy-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 9px 16px;
      border: none;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #fff;
      box-shadow: 0 2px 8px -2px rgba(30, 58, 138, 0.4);
    }

    .copy-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px -2px rgba(30, 58, 138, 0.5);
    }

    .copy-btn.copied {
      background: linear-gradient(135deg, #059669, #10b981);
      box-shadow: 0 2px 8px -2px rgba(5, 150, 105, 0.4);
    }

    .platforms-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px 10px;
    }

    .platform-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      text-decoration: none;
      color: #374151;
      transition: transform 0.2s;
    }

    .platform-btn:hover {
      transform: translateY(-4px);
    }

    .platform-icon {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.18);
      transition: box-shadow 0.2s;
    }

    .platform-btn:hover .platform-icon {
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.28);
    }

    .platform-label {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      text-align: center;
    }

    @media (max-width: 480px) {
      .share-card {
        padding: 32px 18px 24px;
        border-radius: 20px;
      }

      .platform-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
      }

      .platform-label {
        font-size: 10px;
      }
    }
  `],
})
export class ShareModalComponent {
  readonly shareUrl = input.required<string>();
  readonly shareTitle = input<string>('');
  readonly closed = output<void>();

  linkCopied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  readonly platforms: SharePlatform[] = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      bg: '#25D366',
      strokeIcon: false,
      svgPath:
        'M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.445h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.48-8.448zm-8.475 18.304h-.004c-1.774 0-3.513-.477-5.031-1.38l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm5.43-7.402c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z',
      getUrl: (url, title) =>
        `https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      bg: '#0088cc',
      strokeIcon: false,
      svgPath:
        'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
      getUrl: (url, title) =>
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      id: 'x',
      label: 'X',
      bg: '#000000',
      strokeIcon: false,
      svgPath:
        'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
      getUrl: (url, title) =>
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      bg: '#1877F2',
      strokeIcon: false,
      svgPath:
        'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
      getUrl: (url) =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      bg: '#0A66C2',
      strokeIcon: false,
      svgPath:
        'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
      getUrl: (url) =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      id: 'reddit',
      label: 'Reddit',
      bg: '#FF4500',
      strokeIcon: false,
      svgPath:
        'M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z',
      getUrl: (url, title) =>
        `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    },
    {
      id: 'email',
      label: 'Email',
      bg: '#EA4335',
      strokeIcon: false,
      svgPath:
        'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
      getUrl: (url, title) =>
        `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Check out this article: ' + url)}`,
    },
  ];

  copyLink() {
    navigator.clipboard.writeText(this.shareUrl()).then(() => {
      this.linkCopied.set(true);
      if (this.copyTimer) clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => this.linkCopied.set(false), 2500);
    });
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.close();
    }
  }

  close() {
    this.closed.emit();
  }
}
