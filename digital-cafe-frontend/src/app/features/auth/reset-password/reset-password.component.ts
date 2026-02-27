import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";

function passwordMatchValidator(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordKey)?.value;
    const confirmPassword = control.get(confirmPasswordKey)?.value;
    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  };
}

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: "./reset-password.component.html",
  styleUrls: ["./reset-password.component.scss"],
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  loading = false;
  completed = false;
  token: string | null = null;
  useTokenFlow = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get("token");
    this.useTokenFlow = !!this.token;

    this.resetForm = this.fb.group(
      {
        oldPassword: ["", this.useTokenFlow ? [] : [Validators.required, Validators.minLength(8)]],
        newPassword: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/),
          ],
        ],
        confirmPassword: ["", [Validators.required]],
      },
      { validators: passwordMatchValidator("newPassword", "confirmPassword") },
    );
  }

  get f() {
    return this.resetForm.controls;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.alertService.loading("Updating password. Please wait.");

    if (this.useTokenFlow && this.token) {
      this.authService
        .resetPassword(this.token, {
          newPassword: this.f["newPassword"].value,
          confirmPassword: this.f["confirmPassword"].value,
        })
        .subscribe({
          next: () => {
            this.loading = false;
            this.alertService.close();
            this.completed = true;
            this.alertService.success("Password Reset Successful", "Please login with your new password.");
          },
          error: (error) => {
            this.loading = false;
            this.alertService.close();
            this.alertService.error("Reset Failed", error.message || "Failed to reset password.");
          },
        });
      return;
    }

    this.authService
      .changePassword({
        oldPassword: this.f["oldPassword"].value,
        newPassword: this.f["newPassword"].value,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.alertService.close();
          this.completed = true;
          this.alertService.success("Password Updated", "Your password has been changed successfully.");
          this.authService.logout();
        },
        error: (error) => {
          this.loading = false;
          this.alertService.close();
          this.alertService.error("Update Failed", error.message || "Failed to change password.");
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(["/auth/login"]);
  }
}


