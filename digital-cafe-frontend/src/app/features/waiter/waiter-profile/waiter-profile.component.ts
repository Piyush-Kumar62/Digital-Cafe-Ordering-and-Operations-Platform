import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { uppercaseMeridiem } from "@core/utils/date-time-format.util";
import { AlertService } from "@core/services/alert.service";
import { catchError } from "rxjs/operators";
import { forkJoin, of } from "rxjs";

@Component({
  selector: "app-waiter-profile",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./waiter-profile.component.html",
  styleUrls: ["./waiter-profile.component.scss"],
})
export class WaiterProfileComponent implements OnInit {
  private readonly indianMobileRegex = /^[0-9]{10}$/;

  readonly govtIdTypeOptions = [
    "Aadhaar",
    "PAN",
    "Passport",
    "Driving License",
    "Voter ID",
    "Other",
  ];

  currentUser: any = null;
  loading = true;
  saving = false;
  uploadingImage = false;
  uploadingGovtDocument = false;

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
    govtIdFileName: string;
    govtIdContentType: string;
    govtIdDocumentPath: string;
    govtIdFileSize: number;
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
    govtIdFileName: "",
    govtIdContentType: "",
    govtIdDocumentPath: "",
    govtIdFileSize: 0,
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

  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild("govtDocInput") govtDocInput!: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading = true;
    forkJoin({
      basic: this.apiService
        .getCustomerProfile()
        .pipe(catchError(() => of(null))),
      full: this.apiService.getMyFullProfile().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ basic, full }: any) => {
        const firstName =
          basic?.firstName ||
          full?.firstName ||
          this.currentUser?.firstName ||
          "";
        const lastName =
          basic?.lastName || full?.lastName || this.currentUser?.lastName || "";
        const displayName =
          basic?.displayName ||
          full?.displayName ||
          `${firstName} ${lastName}`.trim() ||
          this.currentUser?.username ||
          "";
        this.profileData = {
          firstName,
          lastName,
          displayName,
          email: basic?.email || full?.email || this.currentUser?.email || "",
          role: basic?.role || this.currentUser?.roles?.[0] || "",
          profileImageUrl: this.apiService.resolveImageUrl(
            basic?.profileImageUrl || this.currentUser?.profileImageUrl || "",
          ),
          profileCompletionPercentage:
            basic?.profileCompletionPercentage ??
            full?.completionPercentage ??
            this.currentUser?.profileCompletionPercentage ??
            0,
          lastLogin: basic?.lastLogin || "",
          phoneNumber: basic?.phoneNumber || full?.phoneNumber || "",
          govtIdType: this.normalizeGovtIdType(
            basic?.govtIdType ||
              full?.govtIdType ||
              this.currentUser?.govtIdType ||
              "",
          ),
          govtIdNumber:
            basic?.govtIdNumber ||
            full?.govtIdNumber ||
            this.currentUser?.govtIdNumber ||
            "",
          govtIdFileName: basic?.govtIdFileName || full?.govtIdFileName || "",
          govtIdContentType:
            basic?.govtIdContentType || full?.govtIdContentType || "",
          govtIdDocumentPath:
            basic?.govtIdDocumentPath || full?.govtIdDocumentPath || "",
          govtIdFileSize: basic?.govtIdFileSize ?? full?.govtIdFileSize ?? 0,
          joiningDate:
            basic?.joiningDate || this.currentUser?.joiningDate || "",
          experienceYears:
            basic?.experienceYears ?? this.currentUser?.experienceYears ?? 0,
          shift: basic?.shift || this.currentUser?.shift || "",
        };
        this.syncCurrentUserState();
        this.loading = false;
      },
      error: () => {
        this.profileData.firstName = this.currentUser?.firstName || "";
        this.profileData.lastName = this.currentUser?.lastName || "";
        this.profileData.displayName =
          `${this.profileData.firstName} ${this.profileData.lastName}`.trim();
        this.profileData.email = this.currentUser?.email || "";
        this.profileData.govtIdType = this.normalizeGovtIdType(
          this.currentUser?.govtIdType || "",
        );
        this.profileData.govtIdNumber = this.currentUser?.govtIdNumber || "";
        this.profileData.govtIdFileName =
          this.currentUser?.govtIdFileName || "";
        this.profileData.govtIdContentType =
          this.currentUser?.govtIdContentType || "";
        this.profileData.govtIdDocumentPath =
          this.currentUser?.govtIdDocumentPath || "";
        this.profileData.govtIdFileSize = this.currentUser?.govtIdFileSize || 0;
        this.profileData.joiningDate = this.currentUser?.joiningDate || "";
        this.profileData.experienceYears =
          this.currentUser?.experienceYears || 0;
        this.profileData.shift = this.currentUser?.shift || "";
        this.loading = false;
      },
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

  getGovtDocumentUrl(): string {
    return this.apiService.resolveFileUrl(this.profileData.govtIdDocumentPath);
  }

  hasGovtDocument(): boolean {
    return !!this.getGovtDocumentUrl();
  }

  getGovtDocumentTypeLabel(): string {
    if (!this.hasGovtDocument()) return "";
    if (this.isGovtDocumentPdf()) return "PDF";
    if (this.isGovtDocumentImage()) return "IMAGE";

    const type = (this.profileData.govtIdContentType || "").toLowerCase();
    if (type.includes("word") || type.includes("msword")) return "DOC";

    const fileName = (this.profileData.govtIdFileName || "").toLowerCase();
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return "DOC";

    return "FILE";
  }

  isGovtDocumentImage(): boolean {
    if (!this.hasGovtDocument()) return false;
    const type = (this.profileData.govtIdContentType || "").toLowerCase();
    if (type.startsWith("image/")) return true;
    const fileName = (this.profileData.govtIdFileName || "").toLowerCase();
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
  }

  isGovtDocumentPdf(): boolean {
    if (!this.hasGovtDocument()) return false;
    const type = (this.profileData.govtIdContentType || "").toLowerCase();
    if (type === "application/pdf") return true;
    const fileName = (this.profileData.govtIdFileName || "").toLowerCase();
    return fileName.endsWith(".pdf");
  }

  getGovtDocumentSizeLabel(): string {
    const bytes = Number(this.profileData.govtIdFileSize || 0);
    if (!bytes || bytes < 0) return "";

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  getCafeName(): string {
    return this.currentUser?.cafeName || "—";
  }

  getShift(): string {
    return this.profileData.shift || this.currentUser?.shift || "—";
  }

  getExperience(): string {
    const exp =
      this.profileData.experienceYears ?? this.currentUser?.experienceYears;
    if (exp == null) return "—";
    return `${exp} ${exp === 1 ? "year" : "years"}`;
  }

  getJoinDate(): string {
    const date =
      this.profileData.joiningDate ||
      this.currentUser?.joiningDate ||
      this.currentUser?.createdAt;
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
    return uppercaseMeridiem(
      new Date(l).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    );
  }

  getCompletionClass(): string {
    const p = this.currentCompletionPercentage;
    if (p >= 80) return "high";
    if (p >= 50) return "mid";
    return "low";
  }

  get currentCompletionPercentage(): number {
    const draft = this.editMode ? this.editForm : this.profileData;
    let filled = 0;
    const total = 8;

    if (String(draft.firstName || "").trim()) filled++;
    if (String(draft.lastName || "").trim()) filled++;
    if (String(draft.displayName || "").trim()) filled++;
    if (String(draft.phoneNumber || "").trim()) filled++;
    if (String(draft.govtIdType || "").trim()) filled++;
    if (String(draft.govtIdNumber || "").trim()) filled++;
    if (this.hasGovtDocument()) filled++;
    if (String(draft.joiningDate || "").trim()) filled++;

    const calculated = Math.round((filled * 100) / total);
    const stored = Number(this.profileData.profileCompletionPercentage || 0);
    const safeStored =
      Number.isNaN(stored) || stored < 0
        ? 0
        : Math.min(100, Math.round(stored));

    return Math.max(safeStored, calculated);
  }

  get missingProfileFields(): string[] {
    const source = this.editMode ? this.editForm : this.profileData;
    const missing: string[] = [];

    if (!String(source.firstName || "").trim()) missing.push("First Name");
    if (!String(source.lastName || "").trim()) missing.push("Last Name");
    if (!String(source.displayName || "").trim()) missing.push("Display Name");
    if (!String(source.phoneNumber || "").trim()) missing.push("Phone Number");
    if (!String(source.govtIdType || "").trim())
      missing.push("Government ID Type");
    if (!String(source.govtIdNumber || "").trim())
      missing.push("Government ID Number");
    if (!this.hasGovtDocument()) missing.push("Government ID Document");
    if (!String(source.joiningDate || "").trim()) missing.push("Joining Date");

    return missing;
  }

  get shouldShowMissingWarning(): boolean {
    return (
      this.currentCompletionPercentage < 100 &&
      this.missingProfileFields.length > 0
    );
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

  onPhoneNumberChange(value: string): void {
    this.editForm.phoneNumber = this.normalizePhoneNumber(value);
  }

  onGovtIdTypeChange(): void {
    this.editForm.govtIdNumber = this.normalizeGovtIdNumber(
      this.editForm.govtIdNumber,
      this.editForm.govtIdType,
    );
  }

  onGovtIdNumberChange(value: string): void {
    this.editForm.govtIdNumber = this.normalizeGovtIdNumber(
      value,
      this.editForm.govtIdType,
    );
  }

  getGovtIdNumberMaxLength(type: string = this.editForm.govtIdType): number {
    switch (String(type || "").toLowerCase()) {
      case "aadhaar":
        return 12;
      case "pan":
        return 10;
      case "passport":
        return 9;
      case "driving license":
        return 16;
      case "voter id":
        return 10;
      default:
        return 20;
    }
  }

  saveProfile(): void {
    const normalizedFirstName = this.editForm.firstName.trim();
    const normalizedLastName = this.editForm.lastName.trim();
    const normalizedDisplayName = this.editForm.displayName.trim();
    const previousDisplayName = (this.profileData.displayName || "").trim();
    const derivedDisplayName =
      `${normalizedFirstName} ${normalizedLastName}`.trim();

    if (
      !normalizedDisplayName ||
      normalizedDisplayName === previousDisplayName
    ) {
      this.editForm.displayName = derivedDisplayName;
    }

    if (
      !this.editForm.firstName.trim() ||
      !this.editForm.lastName.trim() ||
      !this.editForm.displayName.trim()
    ) {
      this.alertService.error("Validation", "All fields are required.");
      return;
    }

    this.editForm.phoneNumber = this.normalizePhoneNumber(
      this.editForm.phoneNumber,
    );
    if (
      this.editForm.phoneNumber &&
      !this.indianMobileRegex.test(this.editForm.phoneNumber)
    ) {
      this.alertService.error(
        "Validation",
        "Phone number must be exactly 10 digits.",
      );
      return;
    }

    this.editForm.govtIdNumber = this.normalizeGovtIdNumber(
      this.editForm.govtIdNumber,
      this.editForm.govtIdType,
    );
    if (
      this.editForm.govtIdNumber &&
      !this.isValidGovtIdNumber(
        this.editForm.govtIdNumber,
        this.editForm.govtIdType,
      )
    ) {
      this.alertService.error(
        "Validation",
        this.getGovtIdValidationMessage(this.editForm.govtIdType),
      );
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
        this.profileData.govtIdType = this.normalizeGovtIdType(
          data?.govtIdType || this.editForm.govtIdType || "",
        );
        this.profileData.govtIdNumber =
          data?.govtIdNumber || this.editForm.govtIdNumber || "";
        this.profileData.joiningDate =
          data?.joiningDate || this.editForm.joiningDate || "";
        this.profileData.experienceYears =
          data?.experienceYears ?? this.editForm.experienceYears ?? 0;
        this.profileData.shift = data?.shift || this.editForm.shift || "";
        this.profileData.profileCompletionPercentage =
          data?.profileCompletionPercentage ??
          this.profileData.profileCompletionPercentage;
        if (data?.profileImageUrl)
          this.profileData.profileImageUrl = this.apiService.resolveImageUrl(
            data.profileImageUrl,
          );

        this.syncCurrentUserState();
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

  triggerGovtDocInput(): void {
    this.govtDocInput.nativeElement.click();
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
        if (this.currentUser) {
          this.currentUser = {
            ...this.currentUser,
            profileImageUrl:
              res?.profileImageUrl || this.currentUser.profileImageUrl,
          };
          this.authService.updateUserData(this.currentUser);
        }
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

  onGovtDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.alertService.error(
        "File Too Large",
        "Government ID file must be 2MB or less.",
      );
      input.value = "";
      return;
    }

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      this.alertService.error(
        "Invalid Format",
        "Please upload PDF, JPG, PNG, DOC or DOCX.",
      );
      input.value = "";
      return;
    }

    this.uploadingGovtDocument = true;
    this.apiService.uploadCustomerGovtIdDocument(file).subscribe({
      next: (res: any) => {
        this.profileData.govtIdFileName = res?.govtIdFileName || file.name;
        this.profileData.govtIdContentType =
          res?.govtIdContentType || file.type;
        this.profileData.govtIdDocumentPath =
          res?.govtIdDocumentPath || this.profileData.govtIdDocumentPath;
        this.profileData.govtIdFileSize = res?.govtIdFileSize ?? file.size;
        this.syncCurrentUserState();
        this.uploadingGovtDocument = false;
        this.alertService.success(
          "Uploaded",
          "Government ID document updated.",
        );
      },
      error: () => {
        this.uploadingGovtDocument = false;
        this.alertService.error(
          "Upload Failed",
          "Could not upload government ID document.",
        );
      },
    });
    input.value = "";
  }

  private syncCurrentUserState(): void {
    if (!this.currentUser) return;
    const merged = {
      ...this.currentUser,
      firstName: this.profileData.firstName,
      lastName: this.profileData.lastName,
      displayName: this.profileData.displayName,
      phoneNumber: this.profileData.phoneNumber,
      govtIdType: this.profileData.govtIdType,
      govtIdNumber: this.profileData.govtIdNumber,
      govtIdFileName: this.profileData.govtIdFileName,
      govtIdContentType: this.profileData.govtIdContentType,
      govtIdDocumentPath: this.profileData.govtIdDocumentPath,
      govtIdFileSize: this.profileData.govtIdFileSize,
      joiningDate: this.profileData.joiningDate,
      experienceYears: this.profileData.experienceYears,
      shift: this.profileData.shift,
      profileImageUrl:
        this.profileData.profileImageUrl || this.currentUser.profileImageUrl,
      profileCompletionPercentage: this.profileData.profileCompletionPercentage,
      isProfileComplete: this.profileData.profileCompletionPercentage >= 100,
    };

    const changed = JSON.stringify(merged) !== JSON.stringify(this.currentUser);
    this.currentUser = merged;
    if (changed) {
      this.authService.updateUserData(merged);
    }
  }

  private normalizeGovtIdType(value: string): string {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const normalized = raw.toLowerCase().replace(/[_\-\s]+/g, " ");

    if (normalized.includes("aadhaar") || normalized.includes("aadhar")) {
      return "Aadhaar";
    }
    if (normalized === "pan" || normalized.includes(" pan")) {
      return "PAN";
    }
    if (normalized.includes("passport")) {
      return "Passport";
    }
    if (normalized.includes("driving") || normalized.includes("license")) {
      return "Driving License";
    }
    if (normalized.includes("voter")) {
      return "Voter ID";
    }
    if (normalized.includes("other")) {
      return "Other";
    }

    return raw;
  }

  private normalizePhoneNumber(value: string): string {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  private normalizeGovtIdNumber(value: string, govtIdType: string): string {
    const normalizedType = String(govtIdType || "").toLowerCase();
    const raw = String(value || "").trim();
    if (!raw) return "";

    if (normalizedType === "aadhaar") {
      return raw.replace(/\D/g, "").slice(0, this.getGovtIdNumberMaxLength());
    }

    const cleaned = raw
      .toUpperCase()
      .replace(normalizedType === "other" ? /[^A-Z0-9-]/g : /[^A-Z0-9]/g, "");
    return cleaned.slice(0, this.getGovtIdNumberMaxLength());
  }

  private isValidGovtIdNumber(value: string, govtIdType: string): boolean {
    const id = String(value || "").trim();
    if (!id) return true;

    switch (String(govtIdType || "").toLowerCase()) {
      case "aadhaar":
        return /^\d{12}$/.test(id);
      case "pan":
        return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(id);
      case "passport":
        return /^[A-Z0-9]{6,9}$/.test(id);
      case "driving license":
        return /^[A-Z0-9]{8,16}$/.test(id);
      case "voter id":
        return /^[A-Z0-9]{10}$/.test(id);
      default:
        return /^[A-Z0-9-]{4,20}$/.test(id);
    }
  }

  private getGovtIdValidationMessage(govtIdType: string): string {
    switch (String(govtIdType || "").toLowerCase()) {
      case "aadhaar":
        return "Aadhaar must be exactly 12 digits.";
      case "pan":
        return "PAN must be 10 characters in format AAAAA9999A.";
      case "passport":
        return "Passport number must be 6 to 9 alphanumeric characters.";
      case "driving license":
        return "Driving License must be 8 to 16 alphanumeric characters.";
      case "voter id":
        return "Voter ID must be exactly 10 alphanumeric characters.";
      default:
        return "Government ID must be 4 to 20 valid characters.";
    }
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
