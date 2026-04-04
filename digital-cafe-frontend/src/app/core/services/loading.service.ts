import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private loadingCount = 0;
  private isVisible = false;
  private visibleSince = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly showDelayMs = 180;
  private readonly minVisibleMs = 220;

  show(): void {
    this.loadingCount++;

    if (this.loadingCount !== 1) {
      return;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    if (this.isVisible || this.showTimer) {
      return;
    }

    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      if (this.loadingCount > 0 && !this.isVisible) {
        this.isVisible = true;
        this.visibleSince = Date.now();
        this.loadingSubject.next(true);
      }
    }, this.showDelayMs);
  }

  hide(): void {
    if (this.loadingCount <= 0) {
      return;
    }

    this.loadingCount--;

    if (this.loadingCount > 0) {
      return;
    }

    this.loadingCount = 0;

    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
      return;
    }

    if (!this.isVisible) {
      return;
    }

    const elapsed = Date.now() - this.visibleSince;
    const waitMs = Math.max(0, this.minVisibleMs - elapsed);

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      if (this.loadingCount === 0 && this.isVisible) {
        this.isVisible = false;
        this.visibleSince = 0;
        this.loadingSubject.next(false);
      }
    }, waitMs);
  }

  private clearTimers(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  reset(): void {
    this.loadingCount = 0;
    this.clearTimers();
    this.isVisible = false;
    this.visibleSince = 0;
    this.loadingSubject.next(false);
  }
}
