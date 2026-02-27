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
import { CafeOwnerService } from "../../cafe-owner/services/cafe-owner.service"; // ✅ fixed import

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
    private cafeOwnerService: CafeOwnerService // ✅ injected service
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
    });

    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";

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
    Object.keys(this.loginForm.controls).forEach((key) => {
      this.loginForm.controls[key].markAsTouched();
    });
    return;
  }

  this.loading = true;

  this.authService.login(this.loginForm.value).subscribe({
    next: (response) => {
      this.loading = false;

      console.log("✅ Login API Success:", response);
      this.notificationService.success("Login successful!");

      if (response.mustResetPassword) {
        this.router.navigate(["/auth/reset-password"]);
        return;
      }

      if (!response.isEmailVerified) {
        this.router.navigate(["/auth/verify-email"]);
        return;
      }

      if (this.authService.isCustomer() && !response.isProfileComplete) {
        this.router.navigate(["/customer/complete-profile"]);
        return;
      }

      // 🔥 CHECK ROLE
      console.log("User roles:", this.authService.userRoles);

      if (this.authService.isCafeOwner()) {
        console.log("➡️ Cafe owner detected, checking cafe existence...");

        this.cafeOwnerService.checkCafeExists().subscribe({
          next: (exists: boolean) => {
            console.log("Cafe exists:", exists);

            if (exists) {
              console.log("➡️ Redirecting to dashboard");
              this.router.navigateByUrl("/owner/dashboard");
            } else {
              console.log("➡️ Redirecting to setup page");
              this.router.navigateByUrl("/owner/setup");
            }
          },
          error: (err) => {
            console.error("❌ Cafe check failed:", err);
            this.notificationService.error("Unable to verify cafe setup.");

            // fallback so user is not stuck
            this.router.navigateByUrl("/owner/setup");
          },
        });
      } else {
        const dashboardRoute = this.authService.getRoleDashboardRoute();
        console.log("➡️ Redirecting normal user to:", dashboardRoute);
        this.router.navigateByUrl(dashboardRoute);
      }
    },
    error: (error) => {
      this.loading = false;
      console.error("❌ Login error:", error);
      this.notificationService.error(
        error.message || "Login failed. Please check your credentials."
      );
    },
  });
}
}