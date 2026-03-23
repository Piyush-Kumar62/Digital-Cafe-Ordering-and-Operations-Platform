import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";

@Component({
  selector: "app-waiter-profile",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./waiter-profile.component.html",
  styleUrls: ["./waiter-profile.component.scss"],
})
export class WaiterProfileComponent implements OnInit {
  currentUser: any = null;
  loading = true;
  saving = false;
  uploadingImage = false;

  profileData: {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    role: string;
    profileImageUrl: string;
    profileCompletionPercentage: number;
    lastLogin: string;
    phoneNumber: string;
    govtIdType: string;
    govtIdNumber: string;
    joiningDate: string;
    experienceYears: number;
    shift: string;
  } = {
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    role: "",
    profileImageUrl: "",
    profileCompletionPercentage: 0,
    lastLogin: "",
    phoneNumber: "",
    govtIdType: "",
    govtIdNumber: "",
    joiningDate: "",
    experienceYears: 0,
    shift: "",
  };

  editMode = false;
  editForm = {
    firstName: "",
    lastName: "",
    displayName: "",
    phoneNumber: "",
    govtIdType: "",
    govtIdNumber: "",
    joiningDate: "",
    experienceYears: 0,
    shift: "",
  };

  showPasswordForm = false;
  passwordForm = { oldPassword: "", newPassword: "", confirmPassword: "" };
  passwordSaving = false;
  showOldPass = false;
  showNewPass = false;
  showConfirmPass = false;

  dashboardStats = { readyOrders: 0, servedToday: 0, cafeName: "—" };

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadProfile();
    this.loadDashboardStats();
  }

  private loadProfile(): void {
    this.loading = true;
    this.apiService.getCustomerProfile().subscribe({
      next: (data: any) => {
        this.profileData = {
          firstName: data?.firstName || this.currentUser?.firstName || "",
          lastName: data?.lastName || this.currentUser?.lastName || "",
          displayName: data?.displayName || "",
          email: data?.email || this.currentUser?.email || "",
          role: data?.role || "",
          profileImageUrl: this.apiService.resolveImageUrl(data?.profileImageUrl || ""),
          profileCompletionPercentage: data?.profileCompletionPercentage || 0,
          lastLogin: data?.lastLogin || "",
          phoneNumber: data?.phoneNumber || "",
          govtIdType: data?.govtIdType || this.currentUser?.govtIdType || "",
          govtIdNumber: data?.govtIdNumber || this.currentUser?.govtIdNumber || "",
          joiningDate: data?.joiningDate || this.currentUser?.joiningDate || "",
          experienceYears: data?.experienceYears ?? this.currentUser?.experienceYears ?? 0,
          shift: data?.shift || this.currentUser?.shift || "",
        };
        this.loading = false;
      },
      error: () => {
        this.profileData.firstName = this.currentUser?.firstName || "";
        this.profileData.lastName = this.currentUser?.lastName || "";
        this.profileData.email = this.currentUser?.email || "";
        this.profileData.govtIdType = this.currentUser?.govtIdType || "";
        this.profileData.govtIdNumber = this.currentUser?.govtIdNumber || "";
        this.profileData.joiningDate = this.currentUser?.joiningDate || "";
        this.profileData.experienceYears = this.currentUser?.experienceYears || 0;
        this.profileData.shift = this.currentUser?.shift || "";
        this.loading = false;
      },
    });
  }

  private loadDashboardStats(): void {
    const cafeId = this.currentUser?.cafeId;
    if (!cafeId) return;
    this.apiService.getWaiterDashboard(cafeId).subscribe({
      next: (data) => {
        this.dashboardStats = {
          readyOrders: data?.readyOrders ?? 0,
          servedToday: data?.servedToday ?? 0,
          cafeName: data?.cafeName || "—",
        };
      },
      error: () => {},
    });
  }

  getDisplayName(): string {
    if (this.profileData.displayName) return this.profileData.displayName;
    const fn = this.profileData.firstName;
    const ln = this.profileData.lastName;
    if (fn || ln) return `${fn} ${ln}`.trim();
    return this.currentUser?.username || "Waiter";
  }

  getAvatarText(): string {
    return this.getDisplayName().charAt(0).toUpperCase() || "W";
  }

  getRoleLabel(): string {
    const role =
      this.profileData.role || this.currentUser?.roles?.[0] || "ROLE_WAITER";
    return String(role).replace("ROLE_", "");
  }

  getCafeName(): string {
    return this.dashboardStats.cafeName !== "—"
      ? this.dashboardStats.cafeName
      : this.currentUser?.cafeName || "—";
  }

  getShift(): string {
    return this.profileData.shift || this.currentUser?.shift || "—";
  }

  getExperience(): string {
    const exp = this.profileData.experienceYears ?? this.currentUser?.experienceYears;
    if (exp == null) return "—";
    return `${exp} ${exp === 1 ? "year" : "years"}`;
  }

  getJoinDate(): string {
    const date = this.profileData.joiningDate || this.currentUser?.joiningDate || this.currentUser?.createdAt;
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getLastLogin(): string {
    const l = this.profileData.lastLogin || this.currentUser?.lastLogin;
    if (!l) return "—";
    return new Date(l).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  getCompletionClass(): string {
    const p = this.profileData.profileCompletionPercentage;
    if (p >= 80) return "high";
    if (p >= 50) return "mid";
    return "low";
  }

  // ── Edit Profile ────────────────────────────────────────────
  openEditMode(): void {
    this.editForm = {
      firstName: this.profileData.firstName,
      lastName: this.profileData.lastName,
      displayName:
        this.profileData.displayName ||
        `${this.profileData.firstName} ${this.profileData.lastName}`.trim(),
      phoneNumber: this.profileData.phoneNumber || "",
      govtIdType: this.profileData.govtIdType || "",
      govtIdNumber: this.profileData.govtIdNumber || "",
      joiningDate: this.profileData.joiningDate || "",
      experienceYears: this.profileData.experienceYears || 0,
      shift: this.profileData.shift || "",
    };
    this.editMode = true;
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  saveProfile(): void {
    if (
      !this.editForm.firstName.trim() ||
      !this.editForm.lastName.trim() ||
      !this.editForm.displayName.trim()
    ) {
      this.alertService.error("Validation", "All fields are required.");
      return;
    }
    this.saving = true;
    this.apiService.updateCustomerProfile(this.editForm).subscribe({
      next: (data: any) => {
        this.profileData.firstName = data?.firstName || this.editForm.firstName;
        this.profileData.lastName = data?.lastName || this.editForm.lastName;
        this.profileData.displayName =
          data?.displayName || this.editForm.displayName;
        this.profileData.phoneNumber =
          data?.phoneNumber || this.editForm.phoneNumber || "";
        this.profileData.govtIdType =
          data?.govtIdType || this.editForm.govtIdType || "";
        this.profileData.govtIdNumber =
          data?.govtIdNumber || this.editForm.govtIdNumber || "";
        this.profileData.joiningDate =
          data?.joiningDate || this.editForm.joiningDate || "";
        this.profileData.experienceYears =
          data?.experienceYears ?? this.editForm.experienceYears ?? 0;
        this.profileData.shift = data?.shift || this.editForm.shift || "";
        if (data?.profileImageUrl)
          this.profileData.profileImageUrl = this.apiService.resolveImageUrl(data.profileImageUrl);

        if (this.currentUser) {
          this.currentUser = {
            ...this.currentUser,
            firstName: this.profileData.firstName,
            lastName: this.profileData.lastName,
            govtIdType: this.profileData.govtIdType,
            govtIdNumber: this.profileData.govtIdNumber,
            joiningDate: this.profileData.joiningDate,
            experienceYears: this.profileData.experienceYears,
            shift: this.profileData.shift,
          };
          this.authService.updateUserData(this.currentUser);
        }
        this.saving = false;
        this.editMode = false;
        this.alertService.success("Saved", "Profile updated successfully.");
      },
      error: () => {
        this.saving = false;
        this.alertService.error("Error", "Failed to update profile.");
      },
    });
  }

  // ── Image Upload ─────────────────────────────────────────────
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.alertService.error(
        "File Too Large",
        "Please upload an image under 5MB.",
      );
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      this.alertService.error(
        "Invalid Format",
        "Please upload a JPEG, PNG, WEBP or AVIF image.",
      );
      return;
    }

    this.uploadingImage = true;
    this.apiService.uploadCustomerProfileImage(file).subscribe({
      next: (res: any) => {
        const url = this.apiService.resolveImageUrl(
          res?.profileImageUrl || res?.imageUrl || res?.url || "",
        );
        this.profileData.profileImageUrl = url;
        this.uploadingImage = false;
        this.alertService.success("Uploaded", "Profile picture updated.");
      },
      error: () => {
        this.uploadingImage = false;
        this.alertService.error("Upload Failed", "Could not upload image.");
      },
    });
    input.value = "";
  }

  // ── Change Password ──────────────────────────────────────────
  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm = {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
    }
  }

  savePassword(): void {
    if (
      !this.passwordForm.oldPassword ||
      !this.passwordForm.newPassword ||
      !this.passwordForm.confirmPassword
    ) {
      this.alertService.error(
        "Validation",
        "All password fields are required.",
      );
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.alertService.error(
        "Mismatch",
        "New password and confirm password do not match.",
      );
      return;
    }
    if (this.passwordForm.newPassword.length < 8) {
      this.alertService.error(
        "Too Short",
        "New password must be at least 8 characters.",
      );
      return;
    }

    this.passwordSaving = true;
    this.authService
      .changePassword({
        oldPassword: this.passwordForm.oldPassword,
        newPassword: this.passwordForm.newPassword,
      })
      .subscribe({
        next: () => {
          this.passwordSaving = false;
          this.togglePasswordForm();
          this.alertService.success(
            "Password Changed",
            "Your password has been updated.",
          );
        },
        error: (err: any) => {
          this.passwordSaving = false;
          const msg =
            err?.error?.message ||
            "Incorrect current password or server error.";
          this.alertService.error("Failed", msg);
        },
      });
  }
}
