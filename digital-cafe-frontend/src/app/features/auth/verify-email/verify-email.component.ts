import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="verify-container">
      <div class="verify-card">
        <div *ngIf="!verifying && !verified" class="verify-pending">
          <div class="icon">📧</div>
          <h1>Verify Your Email</h1>
          <p>We've sent a verification link to your email address.</p>
          <p>Please check your inbox and click the link to verify your account.</p>

          <div class="resend-section">
            <p>Didn't receive the email?</p>
            <button class="btn-resend" (click)="resendVerification()" [disabled]="resending">
              {{ resending ? 'Sending...' : 'Resend Verification Email' }}
            </button>
          </div>
        </div>

        <div *ngIf="verifying" class="verify-loading">
          <div class="spinner"></div>
          <h2>Verifying your email...</h2>
          <p>Please wait a moment.</p>
        </div>

        <div *ngIf="verified" class="verify-success">
          <div class="icon success">✓</div>
          <h1>Email Verified!</h1>
          <p>Your email has been successfully verified.</p>
          <button class="btn-primary" routerLink="/auth/login">Continue to Login</button>
        </div>

        <div *ngIf="error" class="verify-error">
          <div class="icon error">✕</div>
          <h1>Verification Failed</h1>
          <p>{{ errorMessage }}</p>
          <button class="btn-primary" routerLink="/auth/login">Back to Login</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .verify-container {
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
      }

      .verify-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        padding: 3rem;
        max-width: 480px;
        text-align: center;
        animation: slideUp 0.4s ease-out;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .icon {
        font-size: 4rem;
        margin-bottom: 1.5rem;

        &.success {
          color: #10b981;
        }

        &.error {
          color: #ef4444;
        }
      }

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1rem;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      p {
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 0.5rem;
      }

      .resend-section {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
      }

      .btn-primary,
      .btn-resend {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.875rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 1rem;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 5px solid #e5e7eb;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 1.5rem;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class VerifyEmailComponent implements OnInit {
  verifying = false;
  verified = false;
  error = false;
  errorMessage = '';
  resending = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // Check if there's a verification token in the URL
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.verifyEmail(token);
    }
  }

  verifyEmail(token: string): void {
    this.verifying = true;

    this.authService.verifyEmail(token).subscribe({
      next: (response) => {
        this.verifying = false;
        this.verified = true;
        this.notificationService.success('Email verified successfully!');
      },
      error: (error) => {
        this.verifying = false;
        this.error = true;
        this.errorMessage = error.message || 'Email verification failed. The link may be expired or invalid.';
      },
    });
  }

  resendVerification(): void {
    const user = this.authService.currentUserValue;
    if (!user || !user.email) {
      this.notificationService.error('Unable to resend verification email.');
      return;
    }

    this.resending = true;

    this.authService.resendVerificationEmail(user.email).subscribe({
      next: (response) => {
        this.resending = false;
        this.notificationService.success('Verification email sent! Please check your inbox.');
      },
      error: (error) => {
        this.resending = false;
        this.notificationService.error(error.message || 'Failed to resend verification email.');
      },
    });
  }
}
