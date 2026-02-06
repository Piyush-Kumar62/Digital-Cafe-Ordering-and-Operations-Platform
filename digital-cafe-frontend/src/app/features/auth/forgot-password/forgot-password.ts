import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  emailSent = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message || 'Password reset link sent to your email!';
        this.emailSent = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to send password reset email.';
      },
    });
  }

  onResend() {
    this.emailSent = false;
    this.successMessage = '';
    this.errorMessage = '';
  }
}
