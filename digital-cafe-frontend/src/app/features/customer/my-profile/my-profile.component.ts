import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
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
import { finalize, forkJoin, of, Subject } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from "rxjs/operators";
import { User } from "@shared/models/auth.model";
import { AddressFormComponent } from "@shared/components/address-form/address-form.component";
import { buildAddressControls } from "@shared/forms/address-form.factory";
import { EducationDataService } from "@shared/services/education-data.service";
import { Institution } from "@shared/models/education.model";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";

type AcademicFormValue = {
  institutionId?: number | null;
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
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AddressFormComponent,
    MatAutocompleteModule,
    MatInputModule,
  ],
  templateUrl: "./my-profile.component.html",
  styleUrls: ["./my-profile.component.scss"],
})
export class MyProfileComponent implements OnInit, OnDestroy {
  form: FormGroup;
  user: User | null = null;
  loading = true;
  saving = false;
  uploadingImage = false;
  removingImage = false;
  loadError = "";
  profileCompletion = 0;
  activeSection: "basic" | "address" | "academic" | "work" = "basic";
  imageVersion = Date.now();
  govtIdVisible = false;
  govtIdTypes = ["Aadhaar", "PAN Card", "Driving License", "Passport"];
  addressFormSubmitted = false;
  degreeOptions: string[] = [];
  academicBranchOptions: string[][] = [];
  academicBranchLoading: boolean[] = [];
  academicBranchNoticeDegree: string[] = [];
  academicInstitutionOptions: Institution[][] = [];
  academicInstitutionLoading: boolean[] = [];
  academicInstitutionNoResults: boolean[] = [];
  private avatarLoadFailed = false;
  private suppressCompletionWatch = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private alertService: AlertService,
    private educationData: EducationDataService,
  ) {
    this.form = this.fb.group({
      firstName: ["", [Validators.required, Validators.maxLength(50)]],
      lastName: ["", [Validators.required, Validators.maxLength(50)]],
      displayName: ["", [Validators.required, Validators.maxLength(120)]],
      dateOfBirth: ["", Validators.required],
      gender: ["", Validators.required],
      phoneNumber: [
        "",
        [
          Validators.required,
          Validators.pattern(/^[0-9]{10}$/),
          Validators.maxLength(10),
        ],
      ],
      govtIdType: ["", [Validators.required, Validators.maxLength(50)]],
      govtIdNumber: ["", [Validators.required, Validators.maxLength(100)]],
      ...buildAddressControls({
        includeCountry: true,
        requireState: true,
        pincodePattern: /^[0-9]{6}$/,
      }),
      profilePictureUrl: [""],
      academicInformation: this.fb.array([this.createAcademicGroup()]),
      workExperiences: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUserValue;
    this.educationData
      .getDegreeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.degreeOptions = options;
      });
    if (this.academicInformation.length) {
      this.initializeAcademicGroup(this.academicInformation.at(0) as FormGroup);
    }
    this.loadProfile();
    this.form.valueChanges
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => {
      if (this.suppressCompletionWatch) return;
      this.profileCompletion = this.calculateCompletionFromForm();
      if (this.user) {
        const updatedUser = {
          ...this.user,
          profileCompletionPercentage: this.profileCompletion,
          isProfileComplete: this.profileCompletion >= 100,
        };
        this.user = updatedUser;
        this.authService.updateUserData(updatedUser);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get academicInformation(): FormArray<FormGroup> {
    return this.form.get("academicInformation") as FormArray<FormGroup>;
  }

  get workExperiences(): FormArray<FormGroup> {
    return this.form.get("workExperiences") as FormArray<FormGroup>;
  }

  get profileImageSrc(): string {
    if (this.avatarLoadFailed) {
      return "";
    }

    const fullProfileUrl = this.form.get("profilePictureUrl")?.value as string;
    const rawUrl = fullProfileUrl || this.user?.profileImageUrl || "";
    if (!rawUrl) {
      return "";
    }

    const resolved = this.apiService.resolveImageUrl(rawUrl);
    if (!resolved) {
      return "";
    }

    return `${resolved}${resolved.includes("?") ? "&" : "?"}v=${this.imageVersion}`;
  }

  get hasProfileImage(): boolean {
    return !!this.profileImageSrc;
  }

  get heroPhone(): string {
    const raw = String(this.form.get("phoneNumber")?.value || "").trim();
    if (!raw) return "—";
    return raw.length === 10 ? `+91 ${raw}` : raw;
  }

  get heroDob(): string {
    const dob = this.form.get("dateOfBirth")?.value;
    if (!dob) return "—";
    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) return String(dob);
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  get heroGender(): string {
    const gender = String(this.form.get("gender")?.value || "").trim();
    return gender || "—";
  }

  get heroGovtId(): string {
    const type = String(this.form.get("govtIdType")?.value || "").trim();
    const number = String(this.form.get("govtIdNumber")?.value || "").trim();
    if (!type && !number) return "—";
    if (!number) return type;
    const masked =
      number.length > 4 ? `${"*".repeat(Math.max(0, number.length - 4))}${number.slice(-4)}` : number;
    return type ? `${type} · ${masked}` : masked;
  }

  onAvatarError(): void {
    this.avatarLoadFailed = true;
  }

  toggleGovtIdVisibility(): void {
    this.govtIdVisible = !this.govtIdVisible;
  }

  onGovtIdTypeChange(): void {
    const currentValue = this.form.get("govtIdNumber")?.value as string;
    if (currentValue) {
      this.form.get("govtIdNumber")?.setValue(currentValue.trim());
    }
  }

  get govtIdNumberPlaceholder(): string {
    switch ((this.form.get("govtIdType")?.value || "").toLowerCase()) {
      case "aadhaar":
        return "Enter Aadhaar Number";
      case "pan card":
        return "Enter PAN Number";
      case "passport":
        return "Enter Passport Number";
      case "driving license":
        return "Enter Driving License Number";
      default:
        return "Enter Government ID Number";
    }
  }

  get govtIdNumberMaxLength(): number | null {
    switch ((this.form.get("govtIdType")?.value || "").toLowerCase()) {
      case "aadhaar":
        return 12;
      case "pan card":
        return 10;
      default:
        return null;
    }
  }

  addAcademicRecord(): void {
    const group = this.createAcademicGroup();
    this.academicInformation.push(group);
    this.initializeAcademicGroup(group);
  }

  removeAcademicRecord(index: number): void {
    if (this.academicInformation.length <= 1) {
      return;
    }
    this.academicInformation.removeAt(index);
    this.academicBranchOptions.splice(index, 1);
    this.academicInstitutionOptions.splice(index, 1);
    this.academicInstitutionLoading.splice(index, 1);
    this.academicInstitutionNoResults.splice(index, 1);
    this.academicBranchNoticeDegree.splice(index, 1);
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
      this.alertService.error(
        "File too large",
        "Please upload an image below 2MB.",
      );
      (event.target as HTMLInputElement).value = "";
      return;
    }

    this.uploadingImage = true;
    this.apiService
      .uploadCustomerProfileImage(file)
      .pipe(finalize(() => (this.uploadingImage = false)))
      .subscribe({
        next: (res) => {
          this.avatarLoadFailed = false;
          const uploadedUrl = res?.profileImageUrl || "";
          if (this.user) {
            this.user = {
              ...this.user,
              profileImageUrl: uploadedUrl || this.user.profileImageUrl,
            };
            this.authService.updateUserData(this.user);
          }
          this.form.patchValue({ profilePictureUrl: uploadedUrl });
          this.imageVersion = Date.now();
          this.alertService.success("Profile image updated");
        },
        error: (error) => {
          const message =
            error?.error?.message || "Unable to upload image right now.";
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
          this.avatarLoadFailed = false;
          if (this.user) {
            this.user = { ...this.user, profileImageUrl: "" };
            this.authService.updateUserData(this.user);
          }
          this.form.patchValue({ profilePictureUrl: "" });
          this.imageVersion = Date.now();
          this.alertService.success("Profile image removed");
        },
        error: (error) => {
          const message =
            error?.error?.message || "Unable to remove image right now.";
          this.alertService.error("Remove failed", message);
        },
      });
  }

  saveProfile(): void {
    if (this.form.invalid) {
      this.addressFormSubmitted = true;
      this.form.markAllAsTouched();
      this.alertService.error(
        "Missing details",
        "Please complete required profile fields.",
      );
      return;
    }

    const v = this.form.value;
    const displayName = (
      v.displayName || `${v.firstName} ${v.lastName}`
    ).trim();

    const fullPayload = {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      phoneNumber: v.phoneNumber,
      govtIdType: v.govtIdType || null,
      govtIdNumber: v.govtIdNumber || null,
      profilePictureUrl:
        v.profilePictureUrl || this.user?.profileImageUrl || null,
      address: {
        street: v.street,
        plotNumber: v.plotNumber,
        city: v.city,
        state: v.state || "",
        country: v.country || "India",
        pincode: v.pincode,
      },
      academicInformation: (v.academicInformation || []).map((a: any) => ({
        institutionId: a.institutionId ?? null,
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
                const message =
                  error?.error?.message ||
                  "Failed to save complete profile details.";
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

  getInstitutionOptions(index: number): Institution[] {
    return this.academicInstitutionOptions[index] || [];
  }

  isInstitutionLoading(index: number): boolean {
    return !!this.academicInstitutionLoading[index];
  }

  isInstitutionNoResults(index: number): boolean {
    return !!this.academicInstitutionNoResults[index];
  }

  getBranchOptions(index: number): string[] {
    return this.academicBranchOptions[index] || [];
  }

  isBranchLoading(index: number): boolean {
    return !!this.academicBranchLoading[index];
  }

  displayInstitution(value: Institution | string): string {
    if (!value) return "";
    return typeof value === "string" ? value : value.name;
  }

  onInstitutionSelected(index: number, inst: Institution): void {
    const group = this.academicInformation.at(index);
    if (!group) return;
    group.get("institutionName")?.setValue(inst.name, { emitEvent: false });
    group.get("institutionId")?.setValue(inst.id ?? null, { emitEvent: false });
  }

  useTypedInstitution(index: number): void {
    const group = this.academicInformation.at(index);
    if (!group) return;
    const raw = group.get("institutionName")?.value;
    const value = String(typeof raw === "string" ? raw : raw?.name || "").trim();
    group.get("institutionName")?.setValue(value, { emitEvent: false });
    group.get("institutionId")?.setValue(null, { emitEvent: false });
    this.academicInstitutionNoResults[index] = false;
    this.academicInstitutionOptions[index] = [];
  }

  private initializeAcademicGroup(group: FormGroup): void {
    const index = this.getAcademicIndex(group);
    if (index < 0) return;
    this.academicInstitutionOptions[index] = [];
    this.academicInstitutionLoading[index] = false;
    this.academicInstitutionNoResults[index] = false;
    this.academicBranchOptions[index] = [];
    this.academicBranchLoading[index] = false;
    this.academicBranchNoticeDegree[index] = "";
    this.loadBranchesForIndex(index, String(group.get("degree")?.value || ""));

    group
      .get("degree")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const idx = this.getAcademicIndex(group);
        if (idx < 0) return;
        this.academicBranchOptions[idx] = [];
        this.loadBranchesForIndex(idx, String(value || ""));
        group.get("fieldOfStudy")?.setValue("", { emitEvent: false });
      });

    group
      .get("institutionName")
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const idx = this.getAcademicIndex(group);
          if (idx >= 0) {
            const query =
              typeof value === "string" ? value : value?.name || "";
            const normalized = String(query || "").trim();
            this.academicInstitutionLoading[idx] = normalized.length >= 2;
            this.academicInstitutionNoResults[idx] = false;
            this.academicInstitutionOptions[idx] = [];
            group.get("institutionId")?.setValue(null, { emitEvent: false });
            if (normalized.length < 2) {
              this.academicInstitutionLoading[idx] = false;
              return of([]);
            }
            return this.educationData.searchInstitutions(normalized).pipe(
              catchError(() => of([])),
            );
          }
          return of([]);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((results) => {
        const idx = this.getAcademicIndex(group);
        if (idx < 0) return;
        this.academicInstitutionLoading[idx] = false;
        this.academicInstitutionOptions[idx] = results || [];
        const raw = group.get("institutionName")?.value;
        const term = String(
          typeof raw === "string" ? raw : raw?.name || "",
        ).trim();
        this.academicInstitutionNoResults[idx] =
          term.length >= 2 && (results || []).length === 0;
      });
  }

  private loadBranchesForIndex(index: number, degree: string): void {
    const key = String(degree || "").trim();
    if (!key) {
      this.academicBranchOptions[index] = [];
      this.academicBranchLoading[index] = false;
      return;
    }
    this.academicBranchLoading[index] = true;
    this.educationData
      .getBranchOptions(key)
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.academicBranchOptions[index] = options || [];
        this.academicBranchLoading[index] = false;
        if (!this.academicBranchOptions[index].length) {
          if (this.academicBranchNoticeDegree[index] !== key) {
            this.academicBranchNoticeDegree[index] = key;
            this.alertService.info(
              "Branch list unavailable",
              "No branches found for this degree yet. You can type your branch manually.",
            );
          }
        }
      });
  }

  private getAcademicIndex(group: FormGroup): number {
    return this.academicInformation.controls.indexOf(group);
  }

  private loadProfile(): void {
    this.loading = true;
    this.loadError = "";
    this.suppressCompletionWatch = true;

    forkJoin({
      basic: this.apiService
        .getCustomerProfile()
        .pipe(catchError(() => of(null))),
      full: this.apiService.getMyFullProfile().pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ basic, full }) => {
          if (!basic && !full) {
            this.loadError = "Unable to load profile details right now.";
            this.suppressCompletionWatch = false;
            return;
          }

          const firstName =
            full?.firstName || basic?.firstName || this.user?.firstName || "";
          const lastName =
            full?.lastName || basic?.lastName || this.user?.lastName || "";
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
            govtIdType: full?.govtIdType || "",
            govtIdNumber: full?.govtIdNumber || "",
            street: full?.address?.street || "",
            plotNumber: full?.address?.plotNumber || "",
            city: full?.address?.city || "",
            state: full?.address?.state || "",
            country: full?.address?.country || "India",
            pincode: full?.address?.pincode || "",
            profilePictureUrl:
              full?.profilePictureUrl || basic?.profileImageUrl || "",
          });

          this.replaceAcademicArray(full?.academicInformation || []);
          this.replaceWorkArray(full?.workExperiences || []);

          if (this.user) {
            const updatedUser = {
              ...this.user,
              firstName,
              lastName,
              profileImageUrl:
                basic?.profileImageUrl || this.user.profileImageUrl,
              profileCompletionPercentage: this.profileCompletion,
              isProfileComplete: this.profileCompletion >= 100,
              lastLogin: basic?.lastLogin || this.user.lastLogin,
            };
            this.user = updatedUser;
            this.authService.updateUserData(updatedUser);
          }

          this.imageVersion = Date.now();
          this.avatarLoadFailed = false;
          this.profileCompletion =
            full?.completionPercentage ??
            this.calculateCompletionFromForm() ??
            this.profileCompletion;
          this.suppressCompletionWatch = false;
        },
        error: () => {
          this.suppressCompletionWatch = false;
        },
      });
  }

  private replaceAcademicArray(items: AcademicFormValue[]): void {
    this.academicInformation.clear();
    if (!items.length) {
      const group = this.createAcademicGroup();
      this.academicInformation.push(group);
      this.initializeAcademicGroup(group);
      return;
    }

    items.forEach((item) => {
      const group = this.createAcademicGroup({
        institutionId: item?.institutionId ?? null,
        institutionName: item?.institutionName || "",
        degree: item?.degree || "",
        fieldOfStudy: item?.fieldOfStudy || "",
        startDate: item?.startDate || "",
        endDate: item?.endDate || "",
        grade: item?.grade || "",
        isCurrent: !!item?.isCurrent,
        description: item?.description || "",
      });
      this.academicInformation.push(group);
      this.initializeAcademicGroup(group);
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
      institutionId: [initial?.institutionId || null],
      institutionName: [
        initial?.institutionName || "",
        [Validators.required, Validators.maxLength(200)],
      ],
      degree: [
        initial?.degree || "",
        [Validators.required, Validators.maxLength(100)],
      ],
      fieldOfStudy: [
        initial?.fieldOfStudy || "",
        [Validators.required, Validators.maxLength(100)],
      ],
      startDate: [initial?.startDate || ""],
      endDate: [initial?.endDate || ""],
      grade: [initial?.grade || "", [Validators.maxLength(20)]],
      isCurrent: [initial?.isCurrent || false],
      description: [initial?.description || ""],
    });
  }

  private createWorkGroup(initial?: Partial<WorkFormValue>): FormGroup {
    return this.fb.group({
      companyName: [
        initial?.companyName || "",
        [Validators.required, Validators.maxLength(200)],
      ],
      position: [
        initial?.position || "",
        [Validators.required, Validators.maxLength(100)],
      ],
      startDate: [initial?.startDate || "", Validators.required],
      endDate: [initial?.endDate || ""],
      isCurrent: [initial?.isCurrent || false],
      location: [initial?.location || "", [Validators.maxLength(100)]],
      description: [initial?.description || ""],
      responsibilities: [initial?.responsibilities || ""],
    });
  }

  private calculateCompletionFromForm(): number {
    const v = this.form.value;
    let filled = 0;
    const total = 9;

    if ((v.firstName || "").trim()) filled++;
    if ((v.lastName || "").trim()) filled++;
    if (v.dateOfBirth) filled++;
    if (v.gender) filled++;
    if ((v.phoneNumber || "").trim()) filled++;
    if ((v.govtIdType || "").trim()) filled++;
    if ((v.govtIdNumber || "").trim()) filled++;

    const addressComplete =
      (v.street || "").trim() &&
      (v.plotNumber || "").trim() &&
      (v.city || "").trim() &&
      (v.state || "").trim() &&
      (v.pincode || "").trim();
    if (addressComplete) filled++;

    const academics = (v.academicInformation || []) as AcademicFormValue[];
    const hasAcademic =
      academics.length > 0 &&
      (academics[0]?.institutionName || "").trim() &&
      (academics[0]?.degree || "").trim();
    if (hasAcademic) filled++;

    return Math.round((filled * 100) / total);
  }
}
