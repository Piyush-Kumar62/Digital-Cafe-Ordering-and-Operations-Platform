import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { TrimInputDirective } from "@shared/directives/trim-input.directive";

@Component({
  selector: "app-verify-email",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TrimInputDirective],
  templateUrl: "./verify-email.component.html",
  styleUrls: ["./verify-email.component.scss"],
})
export class VerifyEmailComponent implements OnInit {
  verifying = false;
  verified = false;
  alreadyVerified = false;
  linkExpired = false;
  error = false;
  errorMessage = "";
  resending = false;
  resendEmail = "";
  hasToken = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams["token"];
    this.hasToken = !!token;

    const user = this.authService.currentUserValue;
    if (user?.email) {
      this.resendEmail = user.email;
    }

    if (token) {
      this.verifyEmail(token);
    }
  }

  verifyEmail(token: string): void {
    this.verifying = true;
    this.error = false;
    this.errorMessage = "";
    this.linkExpired = false;
    this.alreadyVerified = false;

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.verifying = false;
        this.verified = true;
        this.alertService.success(
          "Email Verified",
          "Your email is verified successfully. You can now continue to login.",
        );
      },
      error: (error) => {
        this.verifying = false;

        const message =
          error?.message ||
          error?.error?.message ||
          "Email verification failed. The link may be expired or invalid.";
        const normalized = String(message).toLowerCase();
        const currentUser = this.authService.currentUserValue;

        if (normalized.includes("already verified")) {
          this.verified = true;
          this.alreadyVerified = true;
          this.alertService.info(
            "Already Verified",
            "This email is already verified. Please login to continue.",
          );
          return;
        }

        if (
          normalized.includes("invalid verification token") ||
          normalized.includes("expired")
        ) {
          if (currentUser?.isEmailVerified) {
            this.verified = true;
            this.alreadyVerified = true;
            this.alertService.info(
              "Already Verified",
              "This verification link was already used. Your email is verified.",
            );
            return;
          }

          this.error = true;
          this.linkExpired = true;
          this.errorMessage =
            "This verification link is already used or expired. Request a new verification email below.";
          this.alertService.info("Verification Link Expired", this.errorMessage);
          return;
        }

        this.error = true;
        this.errorMessage = message;
        this.alertService.error("Verification Failed", this.errorMessage);
      },
    });
  }

  resendVerification(): void {
    const email =
      this.resendEmail.replace(/\s+/g, "") ||
      this.authService.currentUserValue?.email ||
      "";

    if (!email) {
      this.alertService.error(
        "Missing Email",
        "Please enter your email to resend verification.",
      );
      return;
    }

    this.resending = true;

    this.authService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.resending = false;
        this.alertService.success(
          "Verification Email Sent",
          "Please check your inbox and click the new verification link.",
        );
      },
      error: (error) => {
        this.resending = false;
        this.alertService.error(
          "Resend Failed",
          error.message || "Failed to resend verification email.",
        );
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(["/auth/login"]);
  }
}
