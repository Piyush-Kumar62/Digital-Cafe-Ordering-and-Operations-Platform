import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage } from '@core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        class="toast"
        [ngClass]="'toast-' + toast.type"
        [@slideIn]
        (click)="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'warning'">⚠</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
        <button class="toast-close" (click)="removeToast(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      }

      .toast {
        display: flex;
        align-items: center;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
      }

      .toast-success {
        background-color: #10b981;
        color: white;
      }

      .toast-error {
        background-color: #ef4444;
        color: white;
      }

      .toast-warning {
        background-color: #f59e0b;
        color: white;
      }

      .toast-info {
        background-color: #3b82f6;
        color: white;
      }

      .toast-icon {
        font-size: 20px;
        font-weight: bold;
        margin-right: 12px;
      }

      .toast-message {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
      }

      .toast-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        margin-left: 12px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .toast-close:hover {
        opacity: 1;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @media (max-width: 640px) {
        .toast-container {
          right: 10px;
          left: 10px;
          max-width: none;
        }

        .toast {
          min-width: auto;
        }
      }
    `,
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))]),
    ]),
  ],
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.toast$.pipe(takeUntil(this.destroy$)).subscribe((toast) => {
      if (toast) {
        this.toasts.push(toast);
      }
    });
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notificationService.removeToast(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
