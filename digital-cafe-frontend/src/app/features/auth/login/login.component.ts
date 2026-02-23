import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  showPassword = false;
  returnUrl: string = "/";

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    // Initialize the form first to prevent template errors
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
    });

    // Get return URL from route parameters or default to role dashboard
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";

    // Check if already logged in and redirect asynchronously
    if (this.authService.isAuthenticated) {
      setTimeout(() => {
        this.router.navigate([this.authService.getRoleDashboardRoute()]);
      }, 0);
    }
  }

  get f() {
    return this.loginForm?.controls || {};
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.loginForm || this.loginForm.invalid) {
      if (this.loginForm) {
        Object.keys(this.loginForm.controls).forEach((key) => {
          this.loginForm.controls[key].markAsTouched();
        });
      }
      return;
    }

    this.loading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;

        this.notificationService.success("Login successful!");

        // Check if user must reset password
        if (response.mustResetPassword) {
          this.router.navigate(["/auth/reset-password"]);
          return;
        }

        // Check if email is verified (bypass for admins - handled by backend)
        if (!response.isEmailVerified) {
          this.router.navigate(["/auth/verify-email"]);
          return;
        }

        // Check if profile is complete (for customers)
        if (this.authService.isCustomer() && !response.isProfileComplete) {
          this.router.navigate(["/customer/complete-profile"]);
          return;
        }

        // Navigate to the appropriate dashboard based on user role
        const dashboardRoute = this.authService.getRoleDashboardRoute();

        // Delay navigation slightly to allow state to settle
        setTimeout(() => {
          this.router.navigate([dashboardRoute]).catch((error) => {
            console.error("Navigation error:", error);
          });
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        console.error("Login error:", error);
        this.notificationService.error(
          error.message || "Login failed. Please check your credentials.",
        );
      },
    });
  }
}
