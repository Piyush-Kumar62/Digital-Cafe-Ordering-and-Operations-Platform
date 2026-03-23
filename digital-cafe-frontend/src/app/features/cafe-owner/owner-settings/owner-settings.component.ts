import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";

import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
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
  loadingProfile = false;
  savingProfile = false;

  profileForm = {
    firstName: "",
    lastName: "",
    displayName: "",
    phoneNumber: "",
    govtIdType: "",
    govtIdNumber: "",
  };

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
    private apiService: ApiService,
    private alertService: AlertService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.loadProfile();
  }

  get userDisplayName(): string {
    if (!this.user) return "";
    const parts = [this.profileForm.firstName, this.profileForm.lastName].filter(Boolean);
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

  saveProfile(): void {
    const firstName = this.profileForm.firstName.trim();
    const lastName = this.profileForm.lastName.trim();
    const displayName =
      this.profileForm.displayName.trim() || `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName || !displayName) {
      this.alertService.error("Please enter first name, last name, and display name.");
      return;
    }

    this.savingProfile = true;
    this.apiService
      .updateCustomerProfile({
        firstName,
        lastName,
        displayName,
        phoneNumber: this.profileForm.phoneNumber?.trim() || undefined,
        govtIdType: this.profileForm.govtIdType?.trim() || undefined,
        govtIdNumber: this.profileForm.govtIdNumber?.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          if (this.user) {
            this.user = {
              ...this.user,
              firstName: res.firstName || firstName,
              lastName: res.lastName || lastName,
              govtIdType: res.govtIdType || this.profileForm.govtIdType,
              govtIdNumber: res.govtIdNumber || this.profileForm.govtIdNumber,
              profileCompletionPercentage:
                res.profileCompletionPercentage ?? this.user.profileCompletionPercentage,
              isProfileComplete:
                (res.profileCompletionPercentage ?? this.user.profileCompletionPercentage) >= 100,
            };
            this.authService.updateUserData(this.user);
          }
          this.alertService.success("Profile updated successfully.");
          this.savingProfile = false;
        },
        error: (err: any) => {
          const msg = err?.error?.message || "Failed to update profile.";
          this.alertService.error(msg);
          this.savingProfile = false;
        },
      });
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
    this.apiService.uploadCustomerProfileImage(file).subscribe({
      next: (res) => {
        this.profileImageUrl = this.apiService.resolveImageUrl(
          res?.profileImageUrl || "",
        );
        if (this.user) {
          this.user = {
            ...this.user,
            profileImageUrl: res?.profileImageUrl || this.user.profileImageUrl,
          };
          this.authService.updateUserData(this.user);
        }
        this.alertService.success("Profile photo updated!");
      },
      error: () => {
        this.alertService.error("Failed to upload profile photo.");
      },
    });
    input.value = "";
  }

  private loadProfile(): void {
    this.loadingProfile = true;
    this.apiService.getCustomerProfile().subscribe({
      next: (profile) => {
        this.profileForm.firstName =
          profile?.firstName || this.user?.firstName || "";
        this.profileForm.lastName =
          profile?.lastName || this.user?.lastName || "";
        this.profileForm.displayName =
          profile?.displayName ||
          `${this.profileForm.firstName} ${this.profileForm.lastName}`.trim();
        this.profileForm.phoneNumber = profile?.phoneNumber || "";
        this.profileForm.govtIdType = profile?.govtIdType || "";
        this.profileForm.govtIdNumber = profile?.govtIdNumber || "";
        this.profileImageUrl = this.apiService.resolveImageUrl(
          profile?.profileImageUrl || this.user?.profileImageUrl || "",
        );

        if (this.user) {
          this.user = {
            ...this.user,
            firstName: this.profileForm.firstName || this.user.firstName,
            lastName: this.profileForm.lastName || this.user.lastName,
            govtIdType: profile?.govtIdType || this.user.govtIdType,
            govtIdNumber: profile?.govtIdNumber || this.user.govtIdNumber,
            profileCompletionPercentage:
              profile?.profileCompletionPercentage ?? this.user.profileCompletionPercentage,
          };
          this.authService.updateUserData(this.user);
        }
        this.loadingProfile = false;
      },
      error: () => {
        this.profileForm.firstName = this.user?.firstName || "";
        this.profileForm.lastName = this.user?.lastName || "";
        this.profileForm.displayName = `${this.profileForm.firstName} ${this.profileForm.lastName}`.trim();
        this.profileImageUrl = this.apiService.resolveImageUrl(
          this.user?.profileImageUrl || "",
        );
        this.loadingProfile = false;
      },
    });
  }
}
