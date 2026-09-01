import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ActivateFreeTrialResult,
  ActiveTopicsData,
  ApiEnvelope,
  FreeTrialNewProduct,
  FreeTrialOffer,
} from '../models/research.models';

const CLIENT_VERSION = '1.1.1';
/** Result strings observed from the API on a successful activation (case-insensitive). */
const SUCCESS_RESULT_PATTERN = /activated|success/i;

@Injectable({ providedIn: 'root' })
export class FreeTrialService {
  private readonly http = inject(HttpClient);

  /** The initial "you have a free trial" offer popup. */
  readonly showOffer = signal(false);
  /** The celebratory popup shown once activation succeeds. */
  readonly showCelebration = signal(false);

  readonly offer = signal<FreeTrialOffer | null>(null);
  readonly activating = signal(false);
  readonly activateError = signal('');
  readonly activatedProducts = signal<FreeTrialNewProduct[]>([]);
  readonly celebrationMessage = signal('');

  private mobileUserKey = '';

  /**
   * Called right after a successful login. `isFreeTrialActive: false` means
   * the user hasn't availed their free trial yet (it's still available to
   * claim) — `true` means it's already active/used, so the dialog stays shut.
   */
  checkAndMaybeShow(mobileUserKey: string): void {
    this.mobileUserKey = mobileUserKey;
    this.getActiveTopics(mobileUserKey).subscribe({
      next: (data) => {
        if (!data || data.isFreeTrialActive) return;
        this.offer.set(data.freeTrial ?? null);
        this.activateError.set('');
        this.showOffer.set(true);
      },
      error: () => undefined,
    });
  }

  getActiveTopics(mobileUserKey: string): Observable<ActiveTopicsData> {
    const params = new HttpParams().set('version', CLIENT_VERSION);
    return this.http
      .get<ApiEnvelope<ActiveTopicsData>>(
        `${environment.gatewayUrl}mqtt/get-active-topics/${encodeURIComponent(mobileUserKey)}`,
        { params },
      )
      .pipe(map((response) => response.data));
  }

  activate(): void {
    if (!this.mobileUserKey || this.activating()) return;

    this.activating.set(true);
    this.activateError.set('');
    this.http
      .get<ApiEnvelope<ActivateFreeTrialResult>>(
        `${environment.gatewayUrl}mqtt/get-active-freetrail/${encodeURIComponent(this.mobileUserKey)}`,
      )
      .pipe(finalize(() => this.activating.set(false)))
      .subscribe({
        next: (response) => {
          const data = response.data;
          const succeeded = SUCCESS_RESULT_PATTERN.test(data?.result ?? '');
          if (succeeded) {
            this.activatedProducts.set(data.newProducts ?? []);
            this.celebrationMessage.set(data.message || 'Your free trial is now active.');
            // Close the offer popup, then bring in the celebration popup a beat later.
            this.showOffer.set(false);
            setTimeout(() => this.showCelebration.set(true), 220);
          } else {
            this.activateError.set(data?.message || response.message || 'We could not activate your free trial. Please try again.');
          }
        },
        error: () => this.activateError.set('We could not activate your free trial. Please try again.'),
      });
  }

  closeOffer(): void {
    this.showOffer.set(false);
  }

  closeCelebration(): void {
    this.showCelebration.set(false);
  }
}
