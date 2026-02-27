import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";

@Component({
  selector: "app-forgot-password",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: "./forgot-password.component.html",
  styleUrls: ["./forgot-password.component.scss"],
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading = false;
  sent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  get f() {
    return this.forgotPasswordForm.controls;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const email = this.forgotPasswordForm.value.email as string;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.sent = true;
        this.notificationService.success("Reset link sent to your email.");
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.error(error.message || "Failed to send reset link.");
      },
    });
  }
}

