import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FreeTrialService } from '../../services/free-trial.service';

interface ConfettiPiece {
  left: number;
  drift: number;
  rotate: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle';
}

const CONFETTI_COLORS = ['#0d6dca', '#0f9d58', '#f5a623', '#e0457c', '#7c5cff'];

@Component({
  selector: 'app-free-trial-dialog',
  imports: [RouterLink, DatePipe],
  templateUrl: './free-trial-dialog.component.html',
  styleUrl: './free-trial-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreeTrialDialogComponent {
  protected readonly trial = inject(FreeTrialService);

  private readonly confettiSeed = signal(0);
  /** Regenerated each time the celebration popup opens, for a fresh burst. */
  protected readonly confetti = computed<ConfettiPiece[]>(() => {
    this.confettiSeed();
    return Array.from({ length: 42 }, () => ({
      left: Math.random() * 100,
      drift: Math.random() * 160 - 80,
      rotate: Math.random() * 520 - 260,
      delay: Math.random() * 0.5,
      duration: 2.2 + Math.random() * 1.4,
      size: 6 + Math.random() * 7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));
  });

  closeOffer(): void {
    if (this.trial.activating()) return;
    this.trial.closeOffer();
  }

  onOfferOverlayClick(): void {
    if (!this.trial.activating()) this.trial.closeOffer();
  }

  closeCelebration(): void {
    this.trial.closeCelebration();
  }

  activate(): void {
    this.confettiSeed.update((n) => n + 1);
    this.trial.activate();
  }
}
