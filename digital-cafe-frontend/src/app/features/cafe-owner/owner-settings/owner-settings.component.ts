import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subject } from "rxjs";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil,
  tap,
} from "rxjs/operators";

import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { User, ChangePasswordRequest } from "@shared/models/auth.model";
import { PostalPincodeService } from "@shared/services/postal-pincode.service";

@Component({
  selector: "app-owner-settings",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./owner-settings.component.html",
  styleUrls: ["./owner-settings.component.scss"],
})
export class OwnerSettingsComponent implements OnInit, OnDestroy {
  readonly defaultProfilePreviewUrl = "assets/placeholders/profile-avatar.svg";
  user: User | null = null;
  profileImageUrl = "";
  uploadingProfilePhoto = false;
  loadingProfile = false;
  savingProfile = false;
  loadingCafe = false;
  savingCafe = false;

  profileForm = {
    firstName: "",
    lastName: "",
    phoneNumber: "",
  };

  cachedCafeDetails: any | null = null;

  cafeForm = {
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phoneNumber: "",
    email: "",
    openingTime: "",
    closingTime: "",
    fssaiNumber: "",
    gstNumber: "",
    msmeNumber: "",
  };

  cafeCityOptions: string[] = [];
  cafeStateOptions: string[] = [];
  cafePincodeLoading = false;
  cafePincodeNotFound = false;
  cafePincodeError = false;
  private readonly cafePincode$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

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
    private postalService: PostalPincodeService,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.loadProfile();
    this.loadCafeDetails();
    this.setupCafePincodeLookup();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  saveProfile(): void {
    const firstName = this.profileForm.firstName.trim();
    const lastName = this.profileForm.lastName.trim();
    const displayName = `${firstName} ${lastName}`.trim();

    if (!firstName || !lastName) {
      this.alertService.error("Please enter first name and last name.");
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
            this.user = {
              ...this.user,
              firstName: res.firstName || firstName,
              lastName: res.lastName || lastName,
              phoneNumber: res.phoneNumber || this.profileForm.phoneNumber,
              profileCompletionPercentage:
                res.profileCompletionPercentage ??
                this.user.profileCompletionPercentage,
              isProfileComplete:
                (res.profileCompletionPercentage ??
                  this.user.profileCompletionPercentage) >= 100,
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
    this.alertService.success("Logged out", "You have been signed out successfully.");
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
          this.user = {
            ...this.user,
            firstName: this.profileForm.firstName || this.user.firstName,
            lastName: this.profileForm.lastName || this.user.lastName,
            profileCompletionPercentage:
              profile?.profileCompletionPercentage ??
              this.user.profileCompletionPercentage,
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

  private loadCafeDetails(): void {
    const cafeId = this.user?.cafeId;
    if (!cafeId) return;
    this.loadingCafe = true;
    this.apiService.getCafeById(cafeId).subscribe({
      next: (cafe) => {
        this.cachedCafeDetails = null;
        this.cafeForm = {
          name: cafe?.name || "",
          description: cafe?.description || "",
          address: cafe?.address || "",
          city: cafe?.city || "",
          state: cafe?.state || "",
          pincode: cafe?.pincode || cafe?.zipCode || "",
          phoneNumber: cafe?.phoneNumber || "",
          email: cafe?.email || this.user?.email || "",
          openingTime: cafe?.openingTime || cafe?.openTime || "",
          closingTime: cafe?.closingTime || cafe?.closeTime || "",
          fssaiNumber: cafe?.fssaiNumber || "",
          gstNumber: cafe?.gstNumber || "",
          msmeNumber: cafe?.msmeNumber || "",
        };
        if (this.cafeForm.pincode) {
          this.onCafePincodeChange(this.cafeForm.pincode);
        }
        this.loadingCafe = false;
      },
      error: () => {
        this.loadingCafe = false;
      },
    });
  }

  onCafePincodeChange(value: string): void {
    this.cafePincode$.next(value);
  }

  private setupCafePincodeLookup(): void {
    this.cafePincode$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((value) => {
          const pin = String(value ?? "").trim();
          if (pin.length < 6) {
            this.cafePincodeLoading = false;
            this.cafePincodeNotFound = false;
            this.cafePincodeError = false;
            this.cafeCityOptions = [];
            this.cafeStateOptions = [];
          }
        }),
        filter((value) => /^[0-9]{6}$/.test(String(value ?? "").trim())),
        tap(() => {
          this.cafePincodeLoading = true;
          this.cafePincodeNotFound = false;
          this.cafePincodeError = false;
        }),
        switchMap((pin) =>
          this.postalService.lookupPincode(String(pin ?? "").trim()),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((result) => {
        this.cafePincodeLoading = false;
        if (result.status === "success") {
          this.cafeCityOptions = result.data.cities;
          this.cafeStateOptions = result.data.states;

          if (!this.cafeForm.city && result.data.cities.length === 1) {
            this.cafeForm.city = result.data.cities[0];
          }
          if (!this.cafeForm.state && result.data.states.length === 1) {
            this.cafeForm.state = result.data.states[0];
          }
          return;
        }

        this.cafePincodeNotFound = result.status === "not_found";
        this.cafePincodeError = result.status === "error";
        this.cafeCityOptions = [];
        this.cafeStateOptions = [];
      });
  }

  private validateCafeForm(): boolean {
    if (!this.cafeForm.name.trim()) {
      this.alertService.error("Café name is required.");
      return false;
    }
    if (!this.cafeForm.address.trim()) {
      this.alertService.error("Café address is required.");
      return false;
    }
    if (!this.cafeForm.city.trim()) {
      this.alertService.error("City is required.");
      return false;
    }
    if (
      !this.cafeForm.pincode.trim() ||
      !/^[0-9]{6}$/.test(this.cafeForm.pincode.trim())
    ) {
      this.alertService.error("Please enter a valid 6-digit pincode.");
      return false;
    }
    if (
      !this.cafeForm.phoneNumber.trim() ||
      !/^[0-9]{10}$/.test(this.cafeForm.phoneNumber.trim())
    ) {
      this.alertService.error("Please enter a valid 10-digit phone number.");
      return false;
    }
    if (!this.cafeForm.email.trim()) {
      this.alertService.error("Café email is required.");
      return false;
    }
    return true;
  }

  saveCafeDetails(): void {
    const cafeId = this.user?.cafeId;
    if (!cafeId) return;
    if (!this.validateCafeForm()) return;
    this.savingCafe = true;
    this.apiService
      .updateCafe(cafeId, {
        name: this.cafeForm.name.trim(),
        description: this.cafeForm.description.trim(),
        address: this.cafeForm.address.trim(),
        city: this.cafeForm.city.trim(),
        state: this.cafeForm.state.trim(),
        pincode: this.cafeForm.pincode.trim(),
        phoneNumber: this.cafeForm.phoneNumber.trim(),
        email: this.cafeForm.email.trim(),
        openTime: this.cafeForm.openingTime || "",
        closeTime: this.cafeForm.closingTime || "",
        fssaiNumber: this.cafeForm.fssaiNumber.trim(),
        gstNumber: this.cafeForm.gstNumber.trim(),
        msmeNumber: this.cafeForm.msmeNumber.trim(),
      })
      .subscribe({
        next: (cafe: any) => {
          this.cafeForm = {
            name: cafe?.name || this.cafeForm.name,
            description: cafe?.description || "",
            address: cafe?.address || this.cafeForm.address,
            city: cafe?.city || this.cafeForm.city,
            state: cafe?.state || this.cafeForm.state,
            pincode: cafe?.pincode || cafe?.zipCode || this.cafeForm.pincode,
            phoneNumber: cafe?.phoneNumber || this.cafeForm.phoneNumber,
            email: cafe?.email || this.cafeForm.email,
            openingTime:
              cafe?.openTime || cafe?.openingTime || this.cafeForm.openingTime,
            closingTime:
              cafe?.closeTime || cafe?.closingTime || this.cafeForm.closingTime,
            fssaiNumber: cafe?.fssaiNumber || this.cafeForm.fssaiNumber,
            gstNumber: cafe?.gstNumber || this.cafeForm.gstNumber,
            msmeNumber: cafe?.msmeNumber || this.cafeForm.msmeNumber,
          };
          this.alertService.success("Café details updated.");
          this.savingCafe = false;
        },
        error: (err: any) => {
          const msg = err?.error?.message || "Failed to update café details.";
          this.alertService.error(msg);
          this.savingCafe = false;
        },
      });
  }
}
