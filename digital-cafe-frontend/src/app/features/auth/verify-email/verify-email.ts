import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  email = '';
  token = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isVerified = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // Check if token is in query params
    this.route.queryParams.subscribe((params) => {
      if (params['token']) {
        this.token = params['token'];
      }
      if (params['email']) {
        this.email = params['email'];
      }
    });

    // Auto-fill email if user is logged in
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && !this.email) {
      this.email = currentUser.email;
    }
  }

  onVerify() {
    if (!this.email || !this.token) {
      this.errorMessage = 'Please provide email and verification token';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyEmail(this.email, this.token).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Email verified successfully!';
        this.isVerified = true;

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Email verification failed. Please try again.';
      },
    });
  }

  onResendVerification() {
    if (!this.email) {
      this.errorMessage = 'Please provide your email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendVerificationEmail(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage =
          response.message || 'Verification email sent! Please check your inbox.';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to resend verification email.';
      },
    });
  }
}
