import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { Component, OnInit } from "@angular/core";

import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import {
  getOwnerMissingRegistrationFields,
  getOwnerRegistrationCompletion,
} from "@core/utils/owner-profile-completion.util";
import { User, ChangePasswordRequest } from "@shared/models/auth.model";

@Component({
  selector: "app-owner-settings",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./owner-settings.component.html",
  styleUrls: ["./owner-settings.component.scss"],
})
export class OwnerSettingsComponent implements OnInit {
  private readonly indianMobileRegex = /^[0-9]{10}$/;

  readonly defaultProfilePreviewUrl = "assets/placeholders/profile-avatar.svg";
  user: User | null = null;
  profileImageUrl = "";
  uploadingProfilePhoto = false;
  loadingProfile = false;
  savingProfile = false;

  profileForm = {
    firstName: "",
    lastName: "",
    phoneNumber: "",
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
    this.syncOwnerCompletionState();
  }

  get userDisplayName(): string {
    if (!this.user) return "";
    const parts = [
      this.profileForm.firstName,
      this.profileForm.lastName,
    ].filter(Boolean);
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

  get liveProfileCompletion(): number {
    return getOwnerRegistrationCompletion({
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      email: this.user?.email,
      phoneNumber: this.profileForm.phoneNumber,
    });
  }

  get ownerMissingProfileFields(): string[] {
    return getOwnerMissingRegistrationFields({
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      email: this.user?.email,
      phoneNumber: this.profileForm.phoneNumber,
    });
  }

  get shouldShowOwnerMissingWarning(): boolean {
    return (
      this.liveProfileCompletion < 100 &&
      this.ownerMissingProfileFields.length > 0
    );
  }

  saveProfile(): void {
    const firstName = this.profileForm.firstName.trim();
    const lastName = this.profileForm.lastName.trim();
    const displayName = `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName) {
      this.alertService.error("Please enter first name and last name.");
      return;
    }

    this.profileForm.phoneNumber = this.normalizePhoneNumber(
      this.profileForm.phoneNumber,
    );
    if (
      this.profileForm.phoneNumber &&
      !this.indianMobileRegex.test(this.profileForm.phoneNumber)
    ) {
      this.alertService.error("Phone number must be exactly 10 digits.");
      return;
    }

    this.savingProfile = true;
    this.apiService
      .updateCustomerProfile({
        firstName,
        lastName,
        displayName,
        phoneNumber: this.profileForm.phoneNumber?.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          if (this.user) {
            const ownerCompletion = getOwnerRegistrationCompletion({
              firstName: res.firstName || firstName,
              lastName: res.lastName || lastName,
              email: this.user.email,
              phoneNumber: res.phoneNumber || this.profileForm.phoneNumber,
            });
            this.user = {
              ...this.user,
              firstName: res.firstName || firstName,
              lastName: res.lastName || lastName,
              phoneNumber: res.phoneNumber || this.profileForm.phoneNumber,
              profileCompletionPercentage: ownerCompletion,
              isProfileComplete: ownerCompletion >= 100,
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

  async logout(): Promise<void> {
    const ok = await this.alertService.confirm(
      "Confirm logout",
      "Are you sure you want to log out?",
    );
    if (!ok) return;
    this.authService.logout();
    this.alertService.success(
      "Logged out",
      "You have been signed out successfully.",
    );
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
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      this.alertService.error(
        "Please upload a JPEG, PNG, WEBP, AVIF or GIF image.",
      );
      input.value = "";
      return;
    }
    const twoMb = 2 * 1024 * 1024;
    if (file.size > twoMb) {
      this.alertService.error("Profile photo must be 2MB or less");
      input.value = "";
      return;
    }
    this.uploadingProfilePhoto = true;
    this.apiService.uploadCustomerProfileImage(file).subscribe({
      next: (res) => {
        const resolved = this.apiService.resolveImageUrl(
          res?.profileImageUrl || "",
        );
        this.profileImageUrl = resolved
          ? `${resolved}${resolved.includes("?") ? "&" : "?"}v=${Date.now()}`
          : "";
        if (this.user) {
          this.user = {
            ...this.user,
            profileImageUrl: res?.profileImageUrl || this.user.profileImageUrl,
          };
          this.authService.updateUserData(this.user);
        }
        this.alertService.success("Profile photo updated!");
        this.uploadingProfilePhoto = false;
      },
      error: () => {
        this.alertService.error("Failed to upload profile photo.");
        this.uploadingProfilePhoto = false;
      },
    });
    input.value = "";
  }

  async removeProfileImage(): Promise<void> {
    if (!this.profileImageUrl) return;
    const ok = await this.alertService.confirm(
      "Remove profile photo?",
      "Your profile photo will be removed.",
    );
    if (!ok) return;

    this.uploadingProfilePhoto = true;
    this.apiService.deleteCustomerProfileImage().subscribe({
      next: () => {
        this.profileImageUrl = "";
        if (this.user) {
          this.user = { ...this.user, profileImageUrl: undefined };
          this.authService.updateUserData(this.user);
        }
        this.alertService.success("Profile photo removed.");
        this.uploadingProfilePhoto = false;
      },
      error: () => {
        this.alertService.error("Failed to remove profile photo.");
        this.uploadingProfilePhoto = false;
      },
    });
  }

  private loadProfile(): void {
    this.loadingProfile = true;
    this.apiService.getCustomerProfile().subscribe({
      next: (profile) => {
        this.profileForm.firstName =
          profile?.firstName || this.user?.firstName || "";
        this.profileForm.lastName =
          profile?.lastName || this.user?.lastName || "";
        this.profileForm.phoneNumber = profile?.phoneNumber || "";
        this.profileImageUrl = this.apiService.resolveImageUrl(
          profile?.profileImageUrl || this.user?.profileImageUrl || "",
        );

        if (this.user) {
          const ownerCompletion = getOwnerRegistrationCompletion({
            firstName: this.profileForm.firstName || this.user.firstName,
            lastName: this.profileForm.lastName || this.user.lastName,
            email: this.user.email,
            phoneNumber: this.profileForm.phoneNumber || this.user.phoneNumber,
          });
          this.user = {
            ...this.user,
            firstName: this.profileForm.firstName || this.user.firstName,
            lastName: this.profileForm.lastName || this.user.lastName,
            phoneNumber: this.profileForm.phoneNumber || this.user.phoneNumber,
            profileCompletionPercentage: ownerCompletion,
            isProfileComplete: ownerCompletion >= 100,
          };
          this.authService.updateUserData(this.user);
        }
        this.loadingProfile = false;
      },
      error: () => {
        this.profileForm.firstName = this.user?.firstName || "";
        this.profileForm.lastName = this.user?.lastName || "";
        this.profileImageUrl = this.apiService.resolveImageUrl(
          this.user?.profileImageUrl || "",
        );
        this.loadingProfile = false;
      },
    });
  }

  syncOwnerCompletionState(): void {
    if (!this.user) return;
    const ownerCompletion = this.liveProfileCompletion;
    this.user = {
      ...this.user,
      profileCompletionPercentage: ownerCompletion,
      isProfileComplete: ownerCompletion >= 100,
    };
    this.authService.updateUserData(this.user);
  }

  onPhoneNumberInput(value: string): void {
    this.profileForm.phoneNumber = this.normalizePhoneNumber(value);
    this.syncOwnerCompletionState();
  }

  private normalizePhoneNumber(value: string): string {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }
}
