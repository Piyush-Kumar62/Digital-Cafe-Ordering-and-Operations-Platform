import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  public toast$ = this.toastSubject.asObservable();

  private toasts: ToastMessage[] = [];

  success(message: string, duration: number = 3000): void {
    this.showToast('success', message, duration);
  }

  error(message: string, duration: number = 5000): void {
    this.showToast('error', message, duration);
  }

  warning(message: string, duration: number = 4000): void {
    this.showToast('warning', message, duration);
  }

  info(message: string, duration: number = 3000): void {
    this.showToast('info', message, duration);
  }

  private showToast(type: ToastMessage['type'], message: string, duration: number): void {
    const toast: ToastMessage = {
      id: this.generateId(),
      type,
      message,
      duration,
    };

    this.toasts.push(toast);
    this.toastSubject.next(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);
    }
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
