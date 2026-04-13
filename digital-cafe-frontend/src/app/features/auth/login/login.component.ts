import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { TrimInputDirective } from "@shared/directives/trim-input.directive";
import {
  sanitizeEmailCredential,
  sanitizeNoWhitespace,
} from "@shared/utils/input-sanitizer.util";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NavbarComponent,
    TrimInputDirective,
  ],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginHeroImage = "/assets/downloads/cafes/login-form-hero.webp";
  heroImageVisible = true;
  loginForm!: FormGroup;
  loading = false;
  showPassword = false;
  returnUrl: string = "/";
  private readonly fallbackHeroImage =
    "/assets/downloads/cafes/login-form-hero.webp";
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.loginHeroImage = this.fallbackHeroImage;
    this.heroImageVisible = true;

    // Initialize the form first to prevent template errors
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
    });
    this.bindNoWhitespaceSanitizer("email");
    this.bindNoWhitespaceSanitizer("password");

    // Get return URL from route parameters or default to role dashboard
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";

    // Check if already logged in and redirect asynchronously
    if (this.authService.isAuthenticated) {
      setTimeout(() => {
        this.router.navigate([this.authService.getRoleDashboardRoute()]);
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onHeroImageError(): void {
    if (this.loginHeroImage !== this.fallbackHeroImage) {
      this.loginHeroImage = this.fallbackHeroImage;
      return;
    }
    this.heroImageVisible = true;
  }

  get f(): Record<string, AbstractControl> {
    return this.loginForm?.controls ?? {};
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.trimCredentialControls();

    if (!this.loginForm || this.loginForm.invalid) {
      if (this.loginForm) {
        Object.keys(this.loginForm.controls).forEach((key) => {
          this.loginForm.controls[key].markAsTouched();
        });
      }
      return;
    }

    this.loading = true;
    this.alertService.loading("Signing you in. Please wait.");

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.alertService.close();

        this.alertService.success("Login Successful", "Welcome back.");

        // Check if user must reset password
        if (response.mustResetPassword) {
          this.router.navigate(["/auth/reset-password"]);
          return;
        }

        // Email verification is not required for system admin.
        if (!this.authService.isSystemAdmin() && !response.isEmailVerified) {
          this.alertService.warning(
            "Email Verification Required",
            "Please verify your email to continue.",
          );
          this.router.navigate(["/auth/verify-email"]);
          return;
        }

        // Check if profile is complete (for customers)
        if (this.authService.isCustomer() && !response.isProfileComplete) {
          this.alertService.warning(
            "Complete Your Profile",
            "Please complete your profile before proceeding.",
          );
          this.router.navigate(["/customer/complete-profile"]);
          return;
        }

        // Navigate to the appropriate dashboard based on user role
        const dashboardRoute = this.authService.getRoleDashboardRoute();

        // Delay navigation slightly to allow state to settle
        setTimeout(() => {
          this.router.navigate([dashboardRoute]).catch(() => {});
        }, 100);
      },
      error: (error) => {
        this.loading = false;
        this.alertService.close();
        this.alertService.error(
          "Login Failed",
          error.message || "Please check your credentials and try again.",
        );
      },
    });
  }

  private trimCredentialControls(): void {
    const emailControl = this.loginForm.get("email");
    if (typeof emailControl?.value === "string") {
      emailControl.setValue(sanitizeEmailCredential(emailControl.value), {
        emitEvent: false,
      });
    }

    const passwordControl = this.loginForm.get("password");
    if (typeof passwordControl?.value === "string") {
      passwordControl.setValue(sanitizeNoWhitespace(passwordControl.value), {
        emitEvent: false,
      });
    }
  }

  private bindNoWhitespaceSanitizer(field: "email" | "password"): void {
    const control = this.loginForm.get(field);
    control?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      if (typeof value !== "string") {
        return;
      }
      const sanitized =
        field === "email"
          ? sanitizeEmailCredential(value)
          : sanitizeNoWhitespace(value);
      if (sanitized !== value) {
        control.setValue(sanitized, { emitEvent: false });
      }
    });
  }
}
