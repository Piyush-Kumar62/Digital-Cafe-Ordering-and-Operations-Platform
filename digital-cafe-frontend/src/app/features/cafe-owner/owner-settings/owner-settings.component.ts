import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { User, ChangePasswordRequest } from "@shared/models/auth.model";

@Component({
  selector: "app-owner-settings",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./owner-settings.component.html",
  styleUrls: ["./owner-settings.component.scss"],
})
export class OwnerSettingsComponent implements OnInit {
  user: User | null = null;
  profileImageUrl = "";

  passwordForm: ChangePasswordRequest = {
    oldPassword: "",
    newPassword: "",
  };
  confirmNewPassword = "";
  passwordLoading = false;

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.profileImageUrl = localStorage.getItem("owner_profile_image") || "";
  }

  get userDisplayName(): string {
    if (!this.user) return "";
    const parts = [this.user.firstName, this.user.lastName].filter(Boolean);
    return parts.length ? parts.join(" ") : this.user.username;
  }

  get userInitials(): string {
    const name = this.userDisplayName.trim();
    const words = name.split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  get primaryRole(): string {
    if (!this.user?.roles?.length) return "Café Owner";
    return this.user.roles[0]
      .replace("ROLE_", "")
      .split("_")
      .map((w) => w[0] + w.slice(1).toLowerCase())
      .join(" ");
  }

  changePassword(): void {
    if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword) {
      this.alertService.error("Please fill in all password fields.");
      return;
    }
    if (this.passwordForm.newPassword !== this.confirmNewPassword) {
      this.alertService.error("New passwords do not match.");
      return;
    }
    if (this.passwordForm.newPassword.length < 8) {
      this.alertService.error("New password must be at least 8 characters.");
      return;
    }

    this.passwordLoading = true;
    this.authService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.alertService.success("Password changed successfully.");
        this.passwordForm = { oldPassword: "", newPassword: "" };
        this.confirmNewPassword = "";
        this.passwordLoading = false;
      },
      error: (err: any) => {
        const msg = err?.error?.message || "Failed to change password.";
        this.alertService.error(msg);
        this.passwordLoading = false;
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/auth/login"]);
  }

  triggerProfileUpload(): void {
    const input = document.getElementById(
      "profilePhotoInput",
    ) as HTMLInputElement;
    input?.click();
  }

  onProfilePhotoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const twoMb = 2 * 1024 * 1024;
    if (file.size > twoMb) {
      this.alertService.error("Profile photo must be 2MB or less");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.profileImageUrl = reader.result as string;
      localStorage.setItem("owner_profile_image", this.profileImageUrl);
      this.alertService.success("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  }
}
