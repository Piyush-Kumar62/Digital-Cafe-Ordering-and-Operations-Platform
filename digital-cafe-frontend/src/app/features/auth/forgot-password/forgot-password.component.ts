import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
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
    private alertService: AlertService,
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
    this.alertService.loading("Sending reset link. Please wait.");
    const email = this.forgotPasswordForm.value.email as string;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.alertService.close();
        this.sent = true;
        this.alertService.success("Reset Link Sent", "Check your inbox for password reset instructions.");
      },
      error: (error) => {
        this.loading = false;
        this.alertService.close();
        this.alertService.error("Reset Request Failed", error.message || "Failed to send reset link.");
      },
    });
  }
}



