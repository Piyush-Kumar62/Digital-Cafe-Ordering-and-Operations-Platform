import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AlertService } from '@core/services/alert.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
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
    private alertService: AlertService,
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
        this.alertService.success('Email verified successfully!');
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
      this.alertService.error('Unable to resend verification email.');
      return;
    }

    this.resending = true;

    this.authService.resendVerificationEmail(user.email).subscribe({
      next: (response) => {
        this.resending = false;
        this.alertService.success('Verification email sent! Please check your inbox.');
      },
      error: (error) => {
        this.resending = false;
        this.alertService.error(error.message || 'Failed to resend verification email.');
      },
    });
  }
}


