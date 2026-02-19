import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

@Component({
  selector: "app-set-password",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: "./set-password.component.html",
  styleUrl: "./set-password.component.scss",
})
export class SetPasswordComponent implements OnInit {

  token = "";
  password = "";
  confirmPassword = "";

  isLoading = false;
  errorMessage = "";
  successMessage = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get("token") || "";
  }

  onSubmit(): void {

    if (this.password !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match";
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = "Password must be at least 6 characters";
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    this.authService.setPassword(this.token, this.password).subscribe({
      next: () => {
        this.successMessage = "Password set successfully! Redirecting to login...";
        this.isLoading = false;

        //clear old user session 
        this.authService.clearAuthState();

        setTimeout(() => this.router.navigate(["/auth/login"]), 1000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "Failed to set password";
        this.isLoading = false;
      }
    });
  }
}
