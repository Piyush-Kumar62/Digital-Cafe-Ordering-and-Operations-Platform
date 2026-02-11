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
    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate([this.authService.getRoleDashboardRoute()]);
      return;
    }

    // Get return URL from route parameters or default to role dashboard
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";

    this.loginForm = this.fb.group({
      username: ["", [Validators.required, Validators.minLength(3)]],
      password: ["", [Validators.required, Validators.minLength(8)]],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.controls[key].markAsTouched();
      });
      return;
    }

    this.loading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.notificationService.success("Login successful!");

        // Check if user must reset password
        if (response.mustResetPassword) {
          this.router.navigate(["/auth/reset-password"]);
          return;
        }

        // Check if email is verified
        if (!response.isEmailVerified) {
          this.router.navigate(["/auth/verify-email"]);
          return;
        }

        // Check if profile is complete (for customers)
        if (this.authService.isCustomer() && !response.isProfileComplete) {
          this.router.navigate(["/customer/complete-profile"]);
          return;
        }

        // Navigate to dashboard
        const dashboardRoute = this.authService.getRoleDashboardRoute();
        this.router.navigate([dashboardRoute]);
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.error(
          error.message || "Login failed. Please check your credentials.",
        );
      },
    });
  }
}
