import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { AuthService } from "@core/auth/auth.service";
import { finalize, forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { User } from "@shared/models/auth.model";

type AcademicFormValue = {
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
  isCurrent: boolean;
  description: string;
};

type WorkFormValue = {
  companyName: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location: string;
  description: string;
  responsibilities: string;
};

@Component({
  selector: "app-my-profile",
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: "./my-profile.component.html",
  styleUrls: ["./my-profile.component.scss"],
})
export class MyProfileComponent implements OnInit {
  readonly defaultAvatar = "assets/branding/brand-logo.png";

  form: FormGroup;
  user: User | null = null;
  loading = true;
  saving = false;
  uploadingImage = false;
  removingImage = false;
  loadError = "";
  profileCompletion = 0;
  imageVersion = Date.now();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private alertService: AlertService,
  ) {
    this.form = this.fb.group({
      firstName: ["", [Validators.required, Validators.maxLength(50)]],
      lastName: ["", [Validators.required, Validators.maxLength(50)]],
      displayName: ["", [Validators.required, Validators.maxLength(120)]],
      dateOfBirth: ["", Validators.required],
      gender: ["", Validators.required],
      phoneNumber: ["", [Validators.required, Validators.pattern(/^[0-9]{10,20}$/)]],
      street: ["", [Validators.required, Validators.maxLength(200)]],
      plotNumber: ["", [Validators.required, Validators.maxLength(50)]],
      city: ["", [Validators.required, Validators.maxLength(100)]],
      state: ["", [Validators.maxLength(100)]],
      country: ["India", [Validators.maxLength(100)]],
      pincode: ["", [Validators.required, Validators.maxLength(10)]],
      profilePictureUrl: [""],
      academicInformation: this.fb.array([this.createAcademicGroup()]),
      workExperiences: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.loadProfile();
  }

  get academicInformation(): FormArray<FormGroup> {
    return this.form.get("academicInformation") as FormArray<FormGroup>;
  }

  get workExperiences(): FormArray<FormGroup> {
    return this.form.get("workExperiences") as FormArray<FormGroup>;
  }

  get profileImageSrc(): string {
    const fullProfileUrl = this.form.get("profilePictureUrl")?.value as string;
    const rawUrl = fullProfileUrl || this.user?.profileImageUrl || "";
    if (!rawUrl) {
      return this.defaultAvatar;
    }

    const resolved = this.apiService.resolveImageUrl(rawUrl);
    if (!resolved) {
      return this.defaultAvatar;
    }

    return `${resolved}${resolved.includes("?") ? "&" : "?"}v=${this.imageVersion}`;
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = this.defaultAvatar;
  }

  addAcademicRecord(): void {
    this.academicInformation.push(this.createAcademicGroup());
  }

  removeAcademicRecord(index: number): void {
    if (this.academicInformation.length <= 1) {
      return;
    }
    this.academicInformation.removeAt(index);
  }

  addWorkExperience(): void {
    this.workExperiences.push(this.createWorkGroup());
  }

  removeWorkExperience(index: number): void {
    this.workExperiences.removeAt(index);
  }

  trackByIndex(index: number): number {
    return index;
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const twoMb = 2 * 1024 * 1024;
    if (file.size > twoMb) {
      this.alertService.error("File too large", "Please upload an image below 2MB.");
      (event.target as HTMLInputElement).value = "";
      return;
    }

    this.uploadingImage = true;
    this.apiService
      .uploadCustomerProfileImage(file)
      .pipe(finalize(() => (this.uploadingImage = false)))
      .subscribe({
        next: (res) => {
          const uploadedUrl = res?.profileImageUrl || "";
          if (this.user) {
            this.user = { ...this.user, profileImageUrl: uploadedUrl || this.user.profileImageUrl };
            this.authService.updateUserData(this.user);
          }
          this.form.patchValue({ profilePictureUrl: uploadedUrl });
          this.imageVersion = Date.now();
          this.alertService.success("Profile image updated");
        },
        error: (error) => {
          const message = error?.error?.message || "Unable to upload image right now.";
          this.alertService.error("Upload failed", message);
        },
      });

    (event.target as HTMLInputElement).value = "";
  }

  removeProfileImage(): void {
    this.removingImage = true;
    this.apiService
      .deleteCustomerProfileImage()
      .pipe(finalize(() => (this.removingImage = false)))
      .subscribe({
        next: () => {
          if (this.user) {
            this.user = { ...this.user, profileImageUrl: "" };
            this.authService.updateUserData(this.user);
          }
          this.form.patchValue({ profilePictureUrl: "" });
          this.imageVersion = Date.now();
          this.alertService.success("Profile image removed");
        },
        error: (error) => {
          const message = error?.error?.message || "Unable to remove image right now.";
          this.alertService.error("Remove failed", message);
        },
      });
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alertService.error("Missing details", "Please complete required profile fields.");
      return;
    }

    const v = this.form.value;
    const displayName = (v.displayName || `${v.firstName} ${v.lastName}`).trim();

    const fullPayload = {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      phoneNumber: v.phoneNumber,
      profilePictureUrl: v.profilePictureUrl || this.user?.profileImageUrl || null,
      address: {
        street: v.street,
        plotNumber: v.plotNumber,
        city: v.city,
        state: v.state || "",
        country: v.country || "India",
        pincode: v.pincode,
      },
      academicInformation: (v.academicInformation || []).map((a: any) => ({
        institutionName: a.institutionName,
        degree: a.degree,
        fieldOfStudy: a.fieldOfStudy || null,
        startDate: a.startDate || null,
        endDate: a.endDate || null,
        grade: a.grade || null,
        isCurrent: !!a.isCurrent,
        description: a.description || null,
      })),
      workExperiences: (v.workExperiences || [])
        .filter((w: any) => w.companyName || w.position || w.startDate)
        .map((w: any) => ({
          companyName: w.companyName,
          position: w.position,
          startDate: w.startDate,
          endDate: w.endDate || null,
          isCurrent: !!w.isCurrent,
          location: w.location || null,
          description: w.description || null,
          responsibilities: w.responsibilities || null,
        })),
    };

    this.saving = true;
    this.apiService
      .updateCustomerProfile({
        firstName: v.firstName,
        lastName: v.lastName,
        displayName,
      })
      .subscribe({
        next: (basicResponse) => {
          this.apiService
            .saveMyFullProfile(fullPayload)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe({
              next: (fullResponse) => {
                const completion =
                  fullResponse?.completionPercentage ??
                  basicResponse?.profileCompletionPercentage ??
                  this.profileCompletion;

                const updatedUser = this.user
                  ? {
                      ...this.user,
                      firstName: v.firstName,
                      lastName: v.lastName,
                      profileImageUrl:
                        basicResponse?.profileImageUrl ||
                        fullResponse?.profilePictureUrl ||
                        this.user.profileImageUrl,
                      profileCompletionPercentage: completion,
                      isProfileComplete: completion >= 100,
                    }
                  : null;

                if (updatedUser) {
                  this.user = updatedUser;
                  this.authService.updateUserData(updatedUser);
                }

                this.profileCompletion = completion;
                this.alertService.success("Profile saved successfully");
              },
              error: (error) => {
                const message = error?.error?.message || "Failed to save complete profile details.";
                this.alertService.error("Save failed", message);
              },
            });
        },
        error: (error) => {
          this.saving = false;
          const message = error?.error?.message || "Failed to save profile.";
          this.alertService.error("Save failed", message);
        },
      });
  }

  fieldError(control: AbstractControl | null, label: string): string {
    if (!control || !control.touched || !control.errors) {
      return "";
    }
    if (control.errors["required"]) return `${label} is required`;
    if (control.errors["maxlength"]) return `${label} is too long`;
    if (control.errors["pattern"]) return `Invalid ${label.toLowerCase()}`;
    return `Invalid ${label.toLowerCase()}`;
  }

  private loadProfile(): void {
    this.loading = true;
    this.loadError = "";

    forkJoin({
      basic: this.apiService.getCustomerProfile().pipe(catchError(() => of(null))),
      full: this.apiService.getMyFullProfile().pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ basic, full }) => {
          if (!basic && !full) {
            this.loadError = "Unable to load profile details right now.";
            return;
          }

          const firstName = full?.firstName || basic?.firstName || this.user?.firstName || "";
          const lastName = full?.lastName || basic?.lastName || this.user?.lastName || "";
          const displayName =
            basic?.displayName ||
            `${firstName} ${lastName}`.trim() ||
            this.user?.username ||
            "";

          this.profileCompletion =
            full?.completionPercentage ??
            basic?.profileCompletionPercentage ??
            this.user?.profileCompletionPercentage ??
            0;

          this.form.patchValue({
            firstName,
            lastName,
            displayName,
            dateOfBirth: full?.dateOfBirth || "",
            gender: full?.gender || "",
            phoneNumber: full?.phoneNumber || "",
            street: full?.address?.street || "",
            plotNumber: full?.address?.plotNumber || "",
            city: full?.address?.city || "",
            state: full?.address?.state || "",
            country: full?.address?.country || "India",
            pincode: full?.address?.pincode || "",
            profilePictureUrl: full?.profilePictureUrl || basic?.profileImageUrl || "",
          });

          this.replaceAcademicArray(full?.academicInformation || []);
          this.replaceWorkArray(full?.workExperiences || []);

          if (this.user) {
            const updatedUser = {
              ...this.user,
              firstName,
              lastName,
              profileImageUrl: basic?.profileImageUrl || this.user.profileImageUrl,
              profileCompletionPercentage: this.profileCompletion,
              isProfileComplete: this.profileCompletion >= 100,
              lastLogin: basic?.lastLogin || this.user.lastLogin,
            };
            this.user = updatedUser;
            this.authService.updateUserData(updatedUser);
          }

          this.imageVersion = Date.now();
        },
      });
  }

  private replaceAcademicArray(items: AcademicFormValue[]): void {
    this.academicInformation.clear();
    if (!items.length) {
      this.academicInformation.push(this.createAcademicGroup());
      return;
    }

    items.forEach((item) => {
      this.academicInformation.push(
        this.createAcademicGroup({
          institutionName: item?.institutionName || "",
          degree: item?.degree || "",
          fieldOfStudy: item?.fieldOfStudy || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          grade: item?.grade || "",
          isCurrent: !!item?.isCurrent,
          description: item?.description || "",
        }),
      );
    });
  }

  private replaceWorkArray(items: WorkFormValue[]): void {
    this.workExperiences.clear();
    items.forEach((item) => {
      this.workExperiences.push(
        this.createWorkGroup({
          companyName: item?.companyName || "",
          position: item?.position || "",
          startDate: item?.startDate || "",
          endDate: item?.endDate || "",
          isCurrent: !!item?.isCurrent,
          location: item?.location || "",
          description: item?.description || "",
          responsibilities: item?.responsibilities || "",
        }),
      );
    });
  }

  private createAcademicGroup(initial?: Partial<AcademicFormValue>): FormGroup {
    return this.fb.group({
      institutionName: [initial?.institutionName || "", [Validators.required, Validators.maxLength(200)]],
      degree: [initial?.degree || "", [Validators.required, Validators.maxLength(100)]],
      fieldOfStudy: [initial?.fieldOfStudy || "", [Validators.maxLength(100)]],
      startDate: [initial?.startDate || ""],
      endDate: [initial?.endDate || ""],
      grade: [initial?.grade || "", [Validators.maxLength(20)]],
      isCurrent: [initial?.isCurrent || false],
      description: [initial?.description || ""],
    });
  }

  private createWorkGroup(initial?: Partial<WorkFormValue>): FormGroup {
    return this.fb.group({
      companyName: [initial?.companyName || "", [Validators.required, Validators.maxLength(200)]],
      position: [initial?.position || "", [Validators.required, Validators.maxLength(100)]],
      startDate: [initial?.startDate || "", Validators.required],
      endDate: [initial?.endDate || ""],
      isCurrent: [initial?.isCurrent || false],
      location: [initial?.location || "", [Validators.maxLength(100)]],
      description: [initial?.description || ""],
      responsibilities: [initial?.responsibilities || ""],
    });
  }
}
