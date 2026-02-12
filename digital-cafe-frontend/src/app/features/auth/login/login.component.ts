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
    console.log("Attempting login with:", this.loginForm.value);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        console.log("=== LOGIN SUCCESS ===");
        console.log("Full response:", response);
        console.log("User roles from response:", response.roles);
        console.log("Email verified:", response.isEmailVerified);
        console.log("Profile complete:", response.isProfileComplete);
        console.log("Must reset password:", response.mustResetPassword);

        this.notificationService.success("Login successful!");

        // Check if user must reset password
        if (response.mustResetPassword) {
          console.log("User must reset password, redirecting...");
          this.router.navigate(["/auth/reset-password"]);
          return;
        }

        // Check if email is verified (bypass for admins - handled by backend)
        if (!response.isEmailVerified) {
          console.log("Email not verified, redirecting...");
          this.router.navigate(["/auth/verify-email"]);
          return;
        }

        // Check if profile is complete (for customers)
        if (this.authService.isCustomer() && !response.isProfileComplete) {
          console.log("Profile incomplete for customer, redirecting...");
          this.router.navigate(["/customer/complete-profile"]);
          return;
        }

        // Navigate to the appropriate dashboard based on user role
        const dashboardRoute = this.authService.getRoleDashboardRoute();
        console.log("=== NAVIGATION INFO ===");
        console.log("User roles from AuthService:", this.authService.userRoles);
        console.log("Is Admin?:", this.authService.isAdmin());
        console.log("Dashboard route:", dashboardRoute);
        console.log(
          "Stored user data:",
          localStorage.getItem("cafe_user_data"),
        );
        console.log(
          "Stored token:",
          localStorage.getItem("cafe_auth_token")
            ? "Token exists (" +
                localStorage.getItem("cafe_auth_token")?.substring(0, 20) +
                "...)"
            : "No token found",
        );

        // Delay navigation slightly to allow state to settle
        setTimeout(() => {
          console.log("Attempting navigation to:", dashboardRoute);
          this.router.navigate([dashboardRoute]).then(
            (success) => {
              console.log("Navigation result:", success);
              if (!success) {
                console.error("Navigation was blocked! Checking guards...");
                console.log("Current user:", this.authService.currentUserValue);
                console.log(
                  "Is authenticated:",
                  this.authService.isAuthenticated,
                );
              }
            },
            (error) => console.error("Navigation error:", error),
          );
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
