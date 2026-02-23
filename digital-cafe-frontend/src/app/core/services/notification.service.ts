import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info';
type SweetAlertFn = (options: Record<string, unknown>) => Promise<unknown>;

declare global {
  interface Window {
    swal?: SweetAlertFn;
  }
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);
  public toast$ = this.toastSubject.asObservable();

  private toasts: ToastMessage[] = [];
  private swalLoader: Promise<SweetAlertFn | null> | null = null;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  success(message: string, duration: number = 3000): void {
    void this.showAlert('success', message, duration);
  }

  error(message: string, duration: number = 5000): void {
    void this.showAlert('error', message, duration);
  }

  warning(message: string, duration: number = 4000): void {
    void this.showAlert('warning', message, duration);
  }

  info(message: string, duration: number = 3000): void {
    void this.showAlert('info', message, duration);
  }

  async confirm(
    title: string,
    text: string,
    confirmText: string = 'Yes',
    cancelText: string = 'Cancel',
  ): Promise<boolean> {
    const swal = await this.getSwal();

    if (!swal) {
      return window.confirm(`${title}\n\n${text}`);
    }

    const result = await swal({
      title,
      text,
      icon: 'warning',
      buttons: {
        cancel: {
          text: cancelText,
          value: false,
          visible: true,
          className: 'swal-btn-cancel',
          closeModal: true,
        },
        confirm: {
          text: confirmText,
          value: true,
          visible: true,
          className: 'swal-btn-confirm',
          closeModal: true,
        },
      },
      dangerMode: true,
    });

    return result === true;
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

  private async showAlert(type: SweetAlertIcon, message: string, duration: number): Promise<void> {
    const swal = await this.getSwal();

    if (!swal) {
      this.showToast(type, message, duration);
      return;
    }

    await swal({
      title: this.getTitle(type),
      text: message,
      icon: type,
      timer: duration > 0 ? duration : undefined,
      buttons: false,
      closeOnClickOutside: true,
      closeOnEsc: true,
    });
  }

  private getTitle(type: SweetAlertIcon): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Info';
    }
  }

  private getSwal(): Promise<SweetAlertFn | null> {
    if (typeof window === 'undefined') {
      return Promise.resolve(null);
    }

    if (window.swal) {
      return Promise.resolve(window.swal);
    }

    if (this.swalLoader) {
      return this.swalLoader;
    }

    this.swalLoader = new Promise((resolve) => {
      const existing = this.document.getElementById('sweetalert-script') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(window.swal || null), { once: true });
        existing.addEventListener('error', () => resolve(null), { once: true });
        return;
      }

      const script = this.document.createElement('script');
      script.id = 'sweetalert-script';
      script.src = 'https://unpkg.com/sweetalert/dist/sweetalert.min.js';
      script.async = true;
      script.onload = () => resolve(window.swal || null);
      script.onerror = () => resolve(null);
      this.document.head.appendChild(script);
    });

    return this.swalLoader;
  }
}
