import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
  branch: string;
  passingYear: string | number;
  gradingType: string;
  score: string;
  currentlyStudying: boolean;
};

type WorkFormValue = {
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  ctcAmount: string;
  ctcCurrency: string;
  reasonForLeaving: string;
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
  private readonly profileCacheKey = "dc_customer_profile_cache_v1";
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
  profileEmail = "";
  degreeOptions: string[] = [];
  academicYearOptions: number[] = [];
  currentYear = new Date().getFullYear();
  readonly maxDob = this.getMaxDob();
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
      email: [{ value: "", disabled: true }],
      dateOfBirth: ["", [Validators.required, this.pastDateValidator]],
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
        includeCountry: false,
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
    this.profileEmail = this.user?.email || "";
    this.educationData
      .getDegreeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.degreeOptions = options;
      });
    this.academicYearOptions = this.buildYearOptions(1950);
    if (this.academicInformation.length) {
      this.initializeAcademicGroup(this.academicInformation.at(0) as FormGroup);
    }
    this.loadProfile();
    this.form.valueChanges
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.suppressCompletionWatch) return;
        if (!this.form.dirty) return;
        this.profileCompletion = this.calculateCompletionFromForm();
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
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+91 ${digits}`;
    return raw;
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
      number.length > 4
        ? `${"*".repeat(Math.max(0, number.length - 4))}${number.slice(-4)}`
        : number;
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

  onWorkCurrentlyWorkingChange(index: number): void {
    const group = this.workExperiences.at(index);
    if (!group) return;
    const isCurrent = !!group.get("currentlyWorking")?.value;
    if (isCurrent) {
      group.get("endDate")?.setValue("");
      group.get("reasonForLeaving")?.setValue("");
    }
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

    const v = this.form.getRawValue();
    const displayName = `${v.firstName} ${v.lastName}`.trim();

    const fullPayload = {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: this.normalizeDateForApi(v.dateOfBirth),
      gender: v.gender,
      phoneNumber: this.normalizePhone(v.phoneNumber),
      govtIdType: v.govtIdType || null,
      govtIdNumber: v.govtIdNumber || null,
      profilePictureUrl:
        v.profilePictureUrl || this.user?.profileImageUrl || null,
      address: {
        street: v.street,
        plotNumber: v.plotNumber,
        city: v.city,
        state: v.state || "",
        pincode: v.pincode,
      },
      academicInformation: (v.academicInformation || []).map((a: any) => ({
        institutionId: a.institutionId ?? null,
        institutionName: a.institutionName,
        degree: a.degree,
        fieldOfStudy: a.branch || null,
        startDate: null,
        endDate: a.passingYear ? `${a.passingYear}-01-01` : null,
        grade: this.buildAcademicGrade(a.gradingType, a.score),
        isCurrent: !!a.currentlyStudying,
        description: null,
      })),
      workExperiences: (v.workExperiences || [])
        .filter((w: any) => w.companyName || w.designation || w.startDate)
        .map((w: any) => ({
          companyName: w.companyName,
          position: w.designation,
          startDate: w.startDate,
          endDate: w.endDate || null,
          isCurrent: !!w.currentlyWorking,
          location: null,
          description: this.buildWorkCtcLabel(w.ctcAmount, w.ctcCurrency),
          responsibilities: w.reasonForLeaving || null,
        })),
    };

    this.saving = true;
    this.apiService
      .updateCustomerProfile({
        firstName: v.firstName,
        lastName: v.lastName,
        displayName,
        dateOfBirth: this.normalizeDateForApi(v.dateOfBirth) || undefined,
        gender: v.gender,
        phoneNumber: this.normalizePhone(v.phoneNumber),
        govtIdType: v.govtIdType || null,
        govtIdNumber: v.govtIdNumber || null,
        address: {
          street: v.street,
          plotNumber: v.plotNumber,
          city: v.city,
          state: v.state || "",
          pincode: v.pincode,
        },
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
                      email: this.profileEmail || this.user.email,
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

                this.writeProfileCache({
                  firstName: v.firstName,
                  lastName: v.lastName,
                  email: this.profileEmail || this.user?.email || "",
                  phoneNumber: v.phoneNumber,
                  dateOfBirth: this.normalizeDateForApi(v.dateOfBirth),
                  gender: v.gender,
                  govtIdType: v.govtIdType,
                  govtIdNumber: v.govtIdNumber,
                  address: {
                    street: v.street,
                    plotNumber: v.plotNumber,
                    city: v.city,
                    state: v.state || "",
                    pincode: v.pincode,
                  },
                  profilePictureUrl:
                    basicResponse?.profileImageUrl ||
                    fullResponse?.profilePictureUrl ||
                    this.user?.profileImageUrl ||
                    "",
                  academicInformation: fullPayload.academicInformation,
                  workExperiences: fullPayload.workExperiences,
                  profileCompletionPercentage: completion,
                });

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
    if (control.errors["notPastDate"]) return `${label} must be in the past`;
    if (control.errors["maxlength"]) return `${label} is too long`;
    if (control.errors["pattern"]) return `Invalid ${label.toLowerCase()}`;
    return `Invalid ${label.toLowerCase()}`;
  }

  get profileMissingFields(): string[] {
    const v = this.form.getRawValue();
    const missing: string[] = [];

    if (!String(v.firstName || "").trim()) missing.push("First Name");
    if (!String(v.lastName || "").trim()) missing.push("Last Name");
    if (!v.dateOfBirth) missing.push("Date of Birth");
    if (!String(v.gender || "").trim()) missing.push("Gender");
    if (!this.normalizePhone(v.phoneNumber)) missing.push("Phone Number");
    if (!String(v.govtIdType || "").trim()) missing.push("Government ID Type");
    if (!String(v.govtIdNumber || "").trim())
      missing.push("Government ID Number");

    if (!String(v.street || "").trim()) missing.push("Street");
    if (!String(v.city || "").trim()) missing.push("City");
    if (!String(v.state || "").trim()) missing.push("State");
    if (!String(v.pincode || "").trim()) missing.push("Pincode");

    const academics = (v.academicInformation || []) as AcademicFormValue[];
    if (
      !academics.length ||
      !String(academics[0]?.institutionName || "").trim()
    ) {
      missing.push("Institution Name");
    }
    if (!academics.length || !String(academics[0]?.degree || "").trim()) {
      missing.push("Degree");
    }
    if (!academics.length || !String(academics[0]?.branch || "").trim()) {
      missing.push("Branch");
    }

    return missing;
  }

  get shouldShowMissingProfileWarning(): boolean {
    return this.profileCompletion < 100 && this.profileMissingFields.length > 0;
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
    const value = String(
      typeof raw === "string" ? raw : raw?.name || "",
    ).trim();
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
    this.syncPassingYearState(group);

    group
      .get("degree")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const idx = this.getAcademicIndex(group);
        if (idx < 0) return;
        this.academicBranchOptions[idx] = [];
        this.loadBranchesForIndex(idx, String(value || ""));
        group.get("branch")?.setValue("", { emitEvent: false });
      });

    group
      .get("currentlyStudying")
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.syncPassingYearState(group));

    group
      .get("institutionName")
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const idx = this.getAcademicIndex(group);
          if (idx >= 0) {
            const query = typeof value === "string" ? value : value?.name || "";
            const normalized = String(query || "").trim();
            this.academicInstitutionLoading[idx] = normalized.length >= 2;
            this.academicInstitutionNoResults[idx] = false;
            this.academicInstitutionOptions[idx] = [];
            group.get("institutionId")?.setValue(null, { emitEvent: false });
            if (normalized.length < 2) {
              this.academicInstitutionLoading[idx] = false;
              return of([]);
            }
            return this.educationData
              .searchInstitutions(normalized)
              .pipe(catchError(() => of([])));
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

  private syncPassingYearState(group: FormGroup): void {
    const yearControl = group.get("passingYear");
    if (!yearControl) return;
    const isCurrent = !!group.get("currentlyStudying")?.value;
    if (isCurrent) {
      yearControl.disable({ emitEvent: false });
      const currentYear = new Date().getFullYear();
      if (!yearControl.value) {
        yearControl.setValue(currentYear, { emitEvent: false });
      }
    } else {
      yearControl.enable({ emitEvent: false });
    }
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
          const cached = this.readProfileCache();
          if (!basic && !full && !cached) {
            this.loadError = "Unable to load profile details right now.";
            this.suppressCompletionWatch = false;
            return;
          }

          const firstName =
            full?.firstName ||
            full?.personalDetails?.firstName ||
            basic?.firstName ||
            cached?.firstName ||
            this.user?.firstName ||
            "";
          const lastName =
            full?.lastName ||
            full?.personalDetails?.lastName ||
            basic?.lastName ||
            cached?.lastName ||
            this.user?.lastName ||
            "";
          const email =
            full?.email ||
            full?.personalDetails?.email ||
            basic?.email ||
            cached?.email ||
            this.user?.email ||
            "";
          const phoneNumber =
            this.normalizePhone(full?.phoneNumber) ||
            this.normalizePhone(full?.personalDetails?.phone) ||
            this.normalizePhone(basic?.phoneNumber) ||
            this.normalizePhone(cached?.phoneNumber) ||
            this.normalizePhone(this.user?.phoneNumber) ||
            "";
          const dateOfBirth =
            this.normalizeDateForInput(full?.dateOfBirth) ||
            this.normalizeDateForInput(full?.personalDetails?.dateOfBirth) ||
            this.normalizeDateForInput(basic?.dateOfBirth) ||
            this.normalizeDateForInput(cached?.dateOfBirth) ||
            "";
          const gender =
            full?.gender ||
            full?.personalDetails?.gender ||
            basic?.gender ||
            cached?.gender ||
            "";
          const govtIdType =
            full?.govtIdType ||
            full?.personalDetails?.govtIdType ||
            basic?.govtIdType ||
            cached?.govtIdType ||
            this.user?.govtIdType ||
            "";
          const govtIdNumber =
            full?.govtIdNumber ||
            full?.personalDetails?.govtIdNumber ||
            basic?.govtIdNumber ||
            cached?.govtIdNumber ||
            this.user?.govtIdNumber ||
            "";
          const address = {
            street:
              full?.address?.street ||
              basic?.address?.street ||
              cached?.address?.street ||
              "",
            plotNumber:
              full?.address?.plotNumber ||
              basic?.address?.plotNumber ||
              cached?.address?.plotNumber ||
              "",
            city:
              full?.address?.city ||
              basic?.address?.city ||
              cached?.address?.city ||
              "",
            state:
              full?.address?.state ||
              basic?.address?.state ||
              cached?.address?.state ||
              "",
            pincode:
              full?.address?.pincode ||
              full?.address?.zipCode ||
              basic?.address?.pincode ||
              (basic?.address as any)?.zipCode ||
              cached?.address?.pincode ||
              cached?.address?.zipCode ||
              "",
          };

          this.profileCompletion =
            full?.completionPercentage ??
            full?.profileCompletionPercentage ??
            basic?.profileCompletionPercentage ??
            cached?.profileCompletionPercentage ??
            this.user?.profileCompletionPercentage ??
            0;

          this.form.patchValue({
            firstName,
            lastName,
            email,
            dateOfBirth,
            gender,
            phoneNumber,
            govtIdType,
            govtIdNumber,
            street: address.street,
            plotNumber: address.plotNumber,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            profilePictureUrl:
              full?.profilePictureUrl ||
              full?.profileImageUrl ||
              basic?.profileImageUrl ||
              this.user?.profileImageUrl ||
              cached?.profilePictureUrl ||
              "",
          });

          this.profileEmail = email;

          const academic =
            full?.academicInformation ||
            full?.academicInfo ||
            full?.academicInfoList ||
            cached?.academicInformation ||
            [];
          const work =
            full?.workExperiences ||
            full?.workExperience ||
            full?.workExperienceList ||
            cached?.workExperiences ||
            [];
          this.replaceAcademicArray(academic);
          this.replaceWorkArray(work);

          if (this.user) {
            const updatedUser = {
              ...this.user,
              firstName,
              lastName,
              email: email || this.user.email,
              profileImageUrl:
                full?.profilePictureUrl ||
                full?.profileImageUrl ||
                basic?.profileImageUrl ||
                this.user.profileImageUrl,
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
            full?.profileCompletionPercentage ??
            basic?.profileCompletionPercentage ??
            this.user?.profileCompletionPercentage ??
            cached?.profileCompletionPercentage ??
            this.calculateCompletionFromForm();
          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.writeProfileCache({
            firstName,
            lastName,
            email,
            phoneNumber,
            dateOfBirth,
            gender,
            govtIdType,
            govtIdNumber,
            address,
            profilePictureUrl:
              full?.profilePictureUrl ||
              full?.profileImageUrl ||
              basic?.profileImageUrl ||
              this.user?.profileImageUrl ||
              "",
            academicInformation: academic,
            workExperiences: work,
            profileCompletionPercentage: this.profileCompletion,
          });
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
      const normalizedField =
        (item as any)?.fieldOfStudy || (item as any)?.branch || "";
      const normalizedIsCurrent =
        (item as any)?.isCurrent ??
        (item as any)?.isCurrentlyStudying ??
        (item as any)?.currentlyStudying ??
        false;
      const normalizedGrade =
        (item as any)?.grade || (item as any)?.gradeInPercentage || "";
      const normalizedPassingYear =
        (item as any)?.passingYear ||
        ((item as any)?.endDate
          ? new Date((item as any).endDate).getFullYear()
          : "");
      const gradingType = (item as any)?.grade
        ? "GRADE"
        : (item as any)?.gradeInPercentage
          ? "PERCENTAGE"
          : this.inferGradingTypeFromProfile((item as any)?.grade);
      const score = this.parseGradeFromProfile(normalizedGrade);
      const group = this.createAcademicGroup({
        institutionId: (item as any)?.institutionId ?? null,
        institutionName: (item as any)?.institutionName || "",
        degree: (item as any)?.degree || "",
        branch: normalizedField,
        passingYear: normalizedPassingYear,
        gradingType,
        score,
        currentlyStudying: !!normalizedIsCurrent,
      });
      this.academicInformation.push(group);
      this.initializeAcademicGroup(group);
    });
  }

  private replaceWorkArray(items: WorkFormValue[]): void {
    this.workExperiences.clear();
    items.forEach((item) => {
      const normalizedPosition =
        (item as any)?.position || (item as any)?.designation || "";
      const normalizedIsCurrent =
        (item as any)?.isCurrent ??
        (item as any)?.isCurrentlyWorking ??
        (item as any)?.currentlyWorking ??
        false;
      this.workExperiences.push(
        this.createWorkGroup({
          companyName: (item as any)?.companyName || "",
          designation: normalizedPosition,
          startDate: (item as any)?.startDate || "",
          endDate: (item as any)?.endDate || "",
          currentlyWorking: !!normalizedIsCurrent,
          ctcAmount: (item as any)?.ctc?.amount || "",
          ctcCurrency: (item as any)?.ctc?.currency || "LPA",
          reasonForLeaving:
            (item as any)?.reasonForLeaving ||
            (item as any)?.responsibilities ||
            "",
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
      branch: [
        (initial as any)?.branch || "",
        [Validators.required, Validators.maxLength(100)],
      ],
      passingYear: [(initial as any)?.passingYear || "", Validators.required],
      gradingType: [
        (initial as any)?.gradingType || "CGPA",
        Validators.required,
      ],
      score: [(initial as any)?.score || ""],
      currentlyStudying: [(initial as any)?.currentlyStudying || false],
    });
  }

  private createWorkGroup(initial?: Partial<WorkFormValue>): FormGroup {
    return this.fb.group({
      companyName: [
        initial?.companyName || "",
        [Validators.required, Validators.maxLength(200)],
      ],
      designation: [
        (initial as any)?.designation || "",
        [Validators.required, Validators.maxLength(100)],
      ],
      startDate: [initial?.startDate || "", Validators.required],
      endDate: [initial?.endDate || ""],
      currentlyWorking: [(initial as any)?.currentlyWorking || false],
      ctcAmount: [(initial as any)?.ctcAmount || ""],
      ctcCurrency: [(initial as any)?.ctcCurrency || "LPA"],
      reasonForLeaving: [(initial as any)?.reasonForLeaving || ""],
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

  private buildAcademicGrade(
    gradingType: string,
    score: string,
  ): string | null {
    const type = String(gradingType || "").trim();
    const val = String(score || "").trim();
    if (!type && !val) return null;
    if (type === "GRADE") return val || null;
    if (type === "CGPA") return val ? `CGPA ${val}` : "CGPA";
    if (type === "PERCENTAGE") return val ? `${val}%` : "PERCENTAGE";
    return val || null;
  }

  private buildWorkCtcLabel(amount: string, currency: string): string | null {
    const amt = String(amount || "").trim();
    const cur = String(currency || "").trim();
    if (!amt || !cur) return null;
    return `CTC: ${amt} ${cur}`;
  }

  private parseGradeFromProfile(raw?: string): string {
    if (!raw) return "";
    if (raw.startsWith("CGPA")) return raw.replace("CGPA", "").trim();
    if (raw.endsWith("%")) return raw.replace("%", "").trim();
    return raw.trim();
  }

  private inferGradingTypeFromProfile(
    raw?: string,
  ): "CGPA" | "PERCENTAGE" | "GRADE" {
    if (!raw) return "CGPA";
    if (raw.startsWith("CGPA")) return "CGPA";
    if (raw.endsWith("%")) return "PERCENTAGE";
    return "GRADE";
  }

  private buildYearOptions(minYear: number): number[] {
    const years: number[] = [];
    for (let y = this.currentYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }

  private readProfileCache(): any | null {
    try {
      const raw = localStorage.getItem(this.profileCacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private writeProfileCache(payload: any): void {
    try {
      localStorage.setItem(this.profileCacheKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }

  private readonly pastDateValidator = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const normalized = this.normalizeDateForInput(control.value);
    if (!normalized) {
      return null;
    }
    const valueDate = new Date(`${normalized}T00:00:00`);
    if (Number.isNaN(valueDate.getTime())) {
      return { notPastDate: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (valueDate >= today) {
      return { notPastDate: true };
    }
    return null;
  };

  private normalizePhone(value: unknown): string {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  private normalizeDateForInput(value: unknown): string {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }
    const ddmmyyyy = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (ddmmyyyy) {
      const [, dd, mm, yyyy] = ddmmyyyy;
      return `${yyyy}-${mm}-${dd}`;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  private normalizeDateForApi(value: unknown): string | null {
    const normalized = this.normalizeDateForInput(value);
    return normalized || null;
  }

  private getMaxDob(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
}
