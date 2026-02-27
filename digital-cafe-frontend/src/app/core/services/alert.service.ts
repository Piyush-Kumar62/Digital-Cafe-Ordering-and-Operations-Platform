import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { ThemeService } from '@core/services/theme.service';
import swal from 'sweetalert';

type AlertType = 'success' | 'error' | 'warning' | 'info';
type SweetAlertFn = (options: Record<string, unknown>) => Promise<unknown>;

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private lastAlertKey = '';
  private lastAlertAt = 0;
  private loadingOpen = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private themeService: ThemeService,
  ) {}

  success(title: string, message?: string): void {
    void this.show('success', title, message);
  }

  error(title: string, message?: string): void {
    void this.show('error', title, message);
  }

  warning(title: string, message?: string): void {
    void this.show('warning', title, message);
  }

  info(title: string, message?: string): void {
    void this.show('info', title, message);
  }

  async confirm(title: string, message: string): Promise<boolean> {
    const swalFn = await this.getSwal();
    if (!swalFn) {
      console.error('SweetAlert is unavailable. Confirmation dialog cannot be shown.');
      return false;
    }

    this.loadingOpen = false;
    const result = await swalFn({
      title,
      text: message,
      icon: 'warning',
      className: this.getSwalThemeClass(),
      dangerMode: true,
      closeOnClickOutside: false,
      closeOnEsc: false,
      buttons: {
        cancel: {
          text: 'Cancel',
          value: false,
          visible: true,
          className: 'swal-btn-cancel',
          closeModal: true,
        },
        confirm: {
          text: 'Confirm',
          value: true,
          visible: true,
          className: 'swal-btn-confirm',
          closeModal: true,
        },
      },
    });
    return result === true;
  }

  loading(message: string): void {
    void this.showLoading(message);
  }

  close(): void {
    (swal as unknown as { close?: () => void }).close?.();
    this.loadingOpen = false;
  }

  private async show(type: AlertType, titleOrMessage: string, message?: string): Promise<void> {
    const swalFn = await this.getSwal();
    if (!swalFn) {
      console.error('SweetAlert is unavailable. Notification not shown as modal.');
      return;
    }

    const title = message ? titleOrMessage : this.getDefaultTitle(type);
    const text = message ?? titleOrMessage;
    if (!this.shouldDisplay(type, title, text)) {
      return;
    }

    if (this.loadingOpen) {
      this.close();
    }

    try {
      await swalFn({
        title,
        text,
        icon: type,
        className: this.getSwalThemeClass(),
        timer: 2800,
        buttons: false,
        closeOnClickOutside: true,
        closeOnEsc: true,
      });
    } catch (error) {
      console.error('SweetAlert display failed:', error);
    }
  }

  private async showLoading(message: string): Promise<void> {
    const swalFn = await this.getSwal();
    if (!swalFn) {
      return;
    }

    if (this.loadingOpen) {
      this.close();
    }

    this.loadingOpen = true;
    try {
      await swalFn({
        title: 'Processing...',
        text: message || 'Please wait',
        icon: 'info',
        className: this.getSwalThemeClass(),
        buttons: false,
        closeOnClickOutside: false,
        closeOnEsc: false,
      });
    } catch {
      this.loadingOpen = false;
    }
  }

  private getDefaultTitle(type: AlertType): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Information';
    }
  }

  private shouldDisplay(type: AlertType, title: string, text: string): boolean {
    const now = Date.now();
    const key = `${type}|${title}|${text}`;
    if (key === this.lastAlertKey && now - this.lastAlertAt < 1000) {
      return false;
    }
    this.lastAlertKey = key;
    this.lastAlertAt = now;
    return true;
  }

  private getSwalThemeClass(): string {
    const root = this.document?.documentElement;
    const body = this.document?.body;
    const isDark =
      this.themeService.isDarkMode() ||
      (!!root && (root.classList.contains('dark') || root.classList.contains('dark-mode'))) ||
      (!!body && body.classList.contains('dark-theme'));
    return isDark ? 'swal-dark-mode' : 'swal-light-mode';
  }

  private getSwal(): Promise<SweetAlertFn | null> {
    if (typeof window === 'undefined' || typeof swal !== 'function') {
      return Promise.resolve(null);
    }
    return Promise.resolve(swal as unknown as SweetAlertFn);
  }
}
