import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EnquiryStateService {
  private _shouldOpen = signal(false);
  readonly shouldOpen = this._shouldOpen.asReadonly();

  open() { this._shouldOpen.set(true); }
  reset() { this._shouldOpen.set(false); }
}
