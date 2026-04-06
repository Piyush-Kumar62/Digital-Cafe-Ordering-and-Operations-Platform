import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "@environments/environment";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { ApiService } from "@core/services/api.service";
import { AddressFormComponent } from "@shared/components/address-form/address-form.component";
import { buildAddressControls } from "@shared/forms/address-form.factory";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { EducationDataService } from "@shared/services/education-data.service";
import { Institution } from "@shared/models/education.model";
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from "rxjs/operators";
import { forkJoin, of } from "rxjs";

interface WorkExperienceFormValue {
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  ctcAmount: string;
  ctcCurrency: string;
  reasonForLeaving: string;
}

@Component({
  selector: "app-complete-profile",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AddressFormComponent,
    MatAutocompleteModule,
    MatInputModule,
  ],
  templateUrl: "./complete-profile.component.html",
  styleUrls: ["./complete-profile.component.scss"],
})
export class CompleteProfileComponent implements OnInit {
  loading = false;
  submitted = false;
  form: FormGroup;
  completionPercentage = 0;
  missingRequiredFields: string[] = [];
  readonly maxDob = this.getMaxDob();
  addressFormSubmitted = false;
  degreeOptions: string[] = [];
  branchOptions: string[] = [];
  branchLoading = false;
  institutionOptions: Institution[] = [];
  institutionLoading = false;
  institutionNoResults = false;
  private branchNoticeDegree = "";
  govtIdTypes = ["Aadhaar", "PAN Card", "Driving License", "Passport"];
  academicYearOptions: number[] = [];
  currentYear = new Date().getFullYear();
  private readonly govtIdNumberValidator = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = String(control.value || "").trim();
    if (!value) return null;

    const type = String(control.parent?.get("govtIdType")?.value || "");
    const maxLength = this.getGovtIdNumberMaxLengthByType(type);
    if (maxLength && value.length > maxLength) {
      return {
        maxlength: {
          requiredLength: maxLength,
          actualLength: value.length,
        },
      };
    }

    const pattern = this.getGovtIdPatternByType(type);
    return pattern.test(value) ? null : { pattern: true };
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private apiService: ApiService,
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
      govtIdType: [""],
      govtIdNumber: ["", [this.govtIdNumberValidator]],
      ...buildAddressControls({
        includeCountry: false,
        requireState: true,
        pincodePattern: /^[0-9]{6}$/,
      }),
      institutionId: [null],
      institutionName: ["", Validators.required],
      degree: ["", Validators.required],
      branch: ["", Validators.required],
      passingYear: ["", Validators.required],
      gradingType: ["CGPA", Validators.required],
      score: [null],
      currentlyStudying: [false],
      workExperienceList: this.fb.array([this.createWorkGroup()]),
    });

    this.educationData.getDegreeOptions().subscribe((options) => {
      this.degreeOptions = options;
    });
    this.academicYearOptions = this.buildYearOptions(1950);

    this.form
      .get("degree")
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        const degree = String(value || "");
        if (!degree) {
          this.branchOptions = [];
          this.branchLoading = false;
          this.form.get("branch")?.setValue("");
          return;
        }

        this.branchLoading = true;
        this.educationData.getBranchOptions(degree).subscribe((branches) => {
          this.branchOptions = branches || [];
          this.branchLoading = false;
          if (
            !this.branchOptions.length &&
            this.branchNoticeDegree !== degree
          ) {
            this.branchNoticeDegree = degree;
            this.alertService.info(
              "Branch list unavailable",
              "No branches found for this degree yet. You can type your branch manually.",
            );
          }
        });
        this.form.get("branch")?.setValue("");
      });

    this.form
      .get("currentlyStudying")
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe(() => this.onAcademicCurrentlyStudyingChange());

    this.form
      .get("institutionName")
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value) => {
          const term = typeof value === "string" ? value : value?.name || "";
          const normalized = term.trim();
          this.institutionLoading = normalized.length >= 2;
          this.institutionNoResults = false;
          this.institutionOptions = [];
          this.form.get("institutionId")?.setValue(null, { emitEvent: false });
          if (normalized.length < 2) {
            this.institutionLoading = false;
            return of([]);
          }

          return this.educationData
            .searchInstitutions(normalized)
            .pipe(switchMap((results) => of(results)));
        }),
      )
      .subscribe((results) => {
        this.institutionLoading = false;
        this.institutionOptions = results || [];
        const raw = this.form.get("institutionName")?.value;
        const query = String(
          typeof raw === "string" ? raw : raw?.name || "",
        ).trim();
        this.institutionNoResults =
          query.length >= 2 && (results || []).length === 0;
      });

    this.form.valueChanges.pipe(debounceTime(120)).subscribe(() => {
      this.updateCompletionPreview();
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user?.isProfileComplete) {
      this.router.navigate(["/customer/dashboard"]);
      return;
    }
    this.prefillFromExistingProfile();
    this.updateCompletionPreview();
  }

  displayInstitution(value: Institution | string): string {
    if (!value) return "";
    return typeof value === "string" ? value : value.name;
  }

  onInstitutionSelected(inst: Institution): void {
    this.form.get("institutionName")?.setValue(inst.name, { emitEvent: false });
    this.form
      .get("institutionId")
      ?.setValue(inst.id ?? null, { emitEvent: false });
  }

  useTypedInstitution(): void {
    const raw = this.form.get("institutionName")?.value;
    const value = String(
      typeof raw === "string" ? raw : raw?.name || "",
    ).trim();
    this.form.get("institutionName")?.setValue(value, { emitEvent: false });
    this.form.get("institutionId")?.setValue(null, { emitEvent: false });
    this.institutionNoResults = false;
    this.institutionOptions = [];
  }

  onAcademicCurrentlyStudyingChange(): void {
    const isCurrent = !!this.form.get("currentlyStudying")?.value;
    const yearControl = this.form.get("passingYear");
    if (!yearControl) return;
    if (isCurrent) {
      yearControl.disable();
      yearControl.setValue(this.currentYear);
    } else {
      yearControl.enable();
    }
  }

  addWorkExperience(): void {
    const group = this.createWorkGroup();
    this.workExperienceList.push(group);
    this.syncWorkGroupState(group);
  }

  removeWorkExperience(index: number): void {
    if (this.workExperienceList.length <= 1) return;
    this.workExperienceList.removeAt(index);
  }

  onCurrentlyWorkingChange(index: number): void {
    const group = this.workExperienceList.at(index);
    if (!group) return;
    const isCurrent = !!group.get("currentlyWorking")?.value;
    if (isCurrent) {
      group.get("endDate")?.setValue("");
      group.get("reasonForLeaving")?.setValue("");
    }
    this.syncWorkGroupState(group);
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  onPhoneInput(value: string): void {
    this.form
      .get("phoneNumber")
      ?.setValue(this.normalizePhone(value), { emitEvent: false });
  }

  onGovtIdTypeChange(): void {
    const type = String(this.form.get("govtIdType")?.value || "");
    const currentValue = this.form.get("govtIdNumber")?.value as string;
    this.form
      .get("govtIdNumber")
      ?.setValue(this.normalizeGovtIdNumber(currentValue, type));
    this.form.get("govtIdNumber")?.updateValueAndValidity();
  }

  onGovtIdNumberInput(value: string): void {
    const type = String(this.form.get("govtIdType")?.value || "");
    this.form
      .get("govtIdNumber")
      ?.setValue(this.normalizeGovtIdNumber(value, type), { emitEvent: false });
    this.form.get("govtIdNumber")?.updateValueAndValidity({
      emitEvent: false,
      onlySelf: true,
    });
  }

  get govtIdNumberMaxLength(): number | null {
    return this.getGovtIdNumberMaxLengthByType(
      String(this.form.get("govtIdType")?.value || ""),
    );
  }

  getDobError(): string {
    const control = this.form.get("dateOfBirth");
    if (!control || !(control.touched || this.submitted)) {
      return "";
    }
    if (control.hasError("required")) {
      return "Date of birth is required.";
    }
    if (control.hasError("notPastDate")) {
      return "Date of birth must be in the past.";
    }
    return "Invalid date of birth.";
  }

  submit(): void {
    if (this.form.invalid) {
      this.addressFormSubmitted = true;
      this.submitted = true;
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.submitted = true;
    const v = this.form.getRawValue();
    const normalizedGovtIdNumber = this.normalizeGovtIdNumber(
      v.govtIdNumber,
      v.govtIdType,
    );
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: this.normalizeDateForApi(v.dateOfBirth),
      gender: v.gender,
      phoneNumber: this.normalizePhone(v.phoneNumber),
      govtIdType: v.govtIdType || null,
      govtIdNumber: normalizedGovtIdNumber || null,
      profilePictureUrl: null,
      address: {
        street: v.street,
        plotNumber: v.plotNumber,
        city: v.city,
        state: v.state,
        pincode: v.pincode,
      },
      academicInformation: [this.buildAcademicPayload(v)],
      workExperiences: this.buildWorkExperiencePayload(),
    };

    this.http
      .post<{
        data?: { completionPercentage?: number };
      }>(`${environment.apiUrl}/profiles`, payload)
      .subscribe({
        next: (res) => {
          const completionPercentage =
            res?.data?.completionPercentage ??
            this.authService.currentUserValue?.profileCompletionPercentage ??
            0;
          this.apiService
            .getCustomerProfile()
            .pipe(catchError(() => of(null)))
            .subscribe((selfProfile) => {
              const refreshedCompletion =
                selfProfile?.profileCompletionPercentage ??
                completionPercentage;
              const refreshedComplete = refreshedCompletion >= 100;
              const currentUser = this.authService.currentUserValue;

              if (currentUser) {
                this.authService.updateUserData({
                  ...currentUser,
                  firstName: v.firstName,
                  lastName: v.lastName,
                  phoneNumber: this.normalizePhone(v.phoneNumber),
                  govtIdType: v.govtIdType || currentUser.govtIdType,
                  govtIdNumber:
                    normalizedGovtIdNumber || currentUser.govtIdNumber,
                  isProfileComplete: refreshedComplete,
                  profileCompletionPercentage: refreshedCompletion,
                });
              }

              this.completionPercentage = refreshedCompletion;
              this.updateCompletionPreview();

              this.alertService.success("Profile completed successfully.");
              this.router.navigate([
                refreshedComplete
                  ? "/customer/dashboard"
                  : "/customer/complete-profile",
              ]);
            });
        },
        error: (error) => {
          const message =
            error?.error?.message || "Failed to complete profile.";
          this.alertService.error(message);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  private prefillFromExistingProfile(): void {
    forkJoin({
      basic: this.apiService
        .getCustomerProfile()
        .pipe(catchError(() => of(null))),
      full: this.apiService.getMyFullProfile().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ basic, full }) => {
        const academic = Array.isArray(full?.academicInformation)
          ? full.academicInformation[0]
          : null;
        const address = full?.address || basic?.address || {};

        this.form.patchValue({
          firstName:
            full?.firstName ||
            basic?.firstName ||
            this.authService.currentUserValue?.firstName ||
            "",
          lastName:
            full?.lastName ||
            basic?.lastName ||
            this.authService.currentUserValue?.lastName ||
            "",
          email:
            full?.email ||
            basic?.email ||
            this.authService.currentUserValue?.email ||
            "",
          dateOfBirth:
            this.normalizeDateForInput(full?.dateOfBirth) ||
            this.normalizeDateForInput(basic?.dateOfBirth) ||
            "",
          gender: full?.gender || basic?.gender || "",
          phoneNumber:
            this.normalizePhone(full?.phoneNumber) ||
            this.normalizePhone(basic?.phoneNumber) ||
            this.normalizePhone(
              this.authService.currentUserValue?.phoneNumber,
            ) ||
            "",
          govtIdType:
            full?.govtIdType ||
            basic?.govtIdType ||
            this.authService.currentUserValue?.govtIdType ||
            "",
          govtIdNumber: this.normalizeGovtIdNumber(
            full?.govtIdNumber ||
              basic?.govtIdNumber ||
              this.authService.currentUserValue?.govtIdNumber ||
              "",
            full?.govtIdType ||
              basic?.govtIdType ||
              this.authService.currentUserValue?.govtIdType ||
              "",
          ),
          street: address?.street || "",
          plotNumber: address?.plotNumber || "",
          city: address?.city || "",
          state: address?.state || "",
          pincode: address?.pincode || address?.zipCode || "",
          institutionId: academic?.institutionId ?? null,
          institutionName: academic?.institutionName || "",
          degree: academic?.degree || "",
          branch: academic?.fieldOfStudy || "",
          passingYear:
            (academic?.endDate
              ? new Date(academic.endDate).getFullYear()
              : "") || "",
          gradingType: this.inferGradingTypeFromProfile(academic?.grade),
          score: this.parseGradeFromProfile(academic?.grade) || "",
          currentlyStudying: !!(
            academic?.isCurrent || academic?.isCurrentlyStudying
          ),
        });

        const workList = this.extractWorkFromSources(full, {});
        this.replaceWorkArray(workList);
        this.onAcademicCurrentlyStudyingChange();
        this.completionPercentage =
          full?.completionPercentage ??
          full?.profileCompletionPercentage ??
          basic?.profileCompletionPercentage ??
          this.authService.currentUserValue?.profileCompletionPercentage ??
          0;
        this.updateCompletionPreview();
      },
      error: () => {
        this.form.patchValue({
          firstName: this.authService.currentUserValue?.firstName || "",
          lastName: this.authService.currentUserValue?.lastName || "",
          email: this.authService.currentUserValue?.email || "",
        });

        const workList = this.extractWorkFromSources(null, {});
        this.replaceWorkArray(workList);
        this.onAcademicCurrentlyStudyingChange();
        this.updateCompletionPreview();
      },
    });
  }

  private calculateCompletionFromForm(): number {
    const v = this.form.getRawValue();
    let filled = 0;
    const total = 9;

    if (String(v.firstName || "").trim()) filled++;
    if (String(v.lastName || "").trim()) filled++;
    if (v.dateOfBirth) filled++;
    if (String(v.gender || "").trim()) filled++;
    if (this.normalizePhone(v.phoneNumber)) filled++;
    if (String(v.govtIdType || "").trim()) filled++;
    if (String(v.govtIdNumber || "").trim()) filled++;

    const addressComplete =
      String(v.street || "").trim() &&
      String(v.city || "").trim() &&
      String(v.state || "").trim() &&
      String(v.pincode || "").trim();
    if (addressComplete) filled++;

    const hasAcademic =
      String(v.institutionName || "").trim() &&
      String(v.degree || "").trim() &&
      String(v.branch || "").trim();
    if (hasAcademic) filled++;

    return Math.round((filled * 100) / total);
  }

  private collectMissingRequiredFields(): string[] {
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

    const addressFields = [
      ["street", "Street"],
      ["city", "City"],
      ["state", "State"],
      ["pincode", "Pincode"],
    ] as const;

    addressFields.forEach(([key, label]) => {
      if (!String((v as any)[key] || "").trim()) {
        missing.push(label);
      }
    });

    if (!String(v.institutionName || "").trim())
      missing.push("Institution Name");
    if (!String(v.degree || "").trim()) missing.push("Degree");
    if (!String(v.branch || "").trim()) missing.push("Branch");

    return missing;
  }

  private updateCompletionPreview(): void {
    this.completionPercentage = this.calculateCompletionFromForm();
    this.missingRequiredFields = this.collectMissingRequiredFields();
  }

  private createWorkGroup(
    initial?: Partial<WorkExperienceFormValue>,
  ): FormGroup {
    return this.fb.group({
      companyName: [initial?.companyName || ""],
      designation: [initial?.designation || ""],
      startDate: [initial?.startDate || ""],
      endDate: [initial?.endDate || ""],
      currentlyWorking: [initial?.currentlyWorking || false],
      ctcAmount: [initial?.ctcAmount || ""],
      ctcCurrency: [initial?.ctcCurrency || "LPA"],
      reasonForLeaving: [initial?.reasonForLeaving || ""],
    });
  }

  private replaceWorkArray(items: any[]): void {
    this.workExperienceList.clear();
    if (!items?.length) {
      const group = this.createWorkGroup();
      this.workExperienceList.push(group);
      this.syncWorkGroupState(group);
      return;
    }
    items.forEach((item) => {
      const group = this.createWorkGroup({
        companyName: item?.companyName || "",
        designation: item?.designation || item?.position || "",
        startDate: item?.startDate || "",
        endDate: item?.endDate || "",
        currentlyWorking:
          item?.currentlyWorking ||
          item?.isCurrent ||
          item?.isCurrentlyWorking ||
          false,
        ctcAmount: item?.ctc?.amount || "",
        ctcCurrency: item?.ctc?.currency || "LPA",
        reasonForLeaving:
          item?.reasonForLeaving || item?.responsibilities || "",
      });
      this.workExperienceList.push(group);
      this.syncWorkGroupState(group);
    });
  }

  private syncWorkGroupState(group: FormGroup): void {
    const isCurrent = !!group.get("currentlyWorking")?.value;
    const endDate = group.get("endDate");
    if (!endDate) return;
    if (isCurrent) {
      endDate.disable({ emitEvent: false });
      endDate.setValue("", { emitEvent: false });
    } else {
      endDate.enable({ emitEvent: false });
    }
  }

  private buildWorkExperiencePayload(): any[] {
    const items = this.workExperienceList.getRawValue() as any[];
    return (items || [])
      .filter(
        (w) =>
          String(w.companyName || "").trim() ||
          String(w.designation || "").trim() ||
          String(w.startDate || "").trim(),
      )
      .map((w) => {
        const ctcAmount = String(w.ctcAmount || "").trim();
        const ctcCurrency = String(w.ctcCurrency || "").trim();
        const ctcLabel =
          ctcAmount && ctcCurrency ? `CTC: ${ctcAmount} ${ctcCurrency}` : "";
        return {
          companyName: String(w.companyName || "").trim(),
          position: String(w.designation || "").trim(),
          startDate: w.startDate || null,
          endDate: w.endDate || null,
          isCurrent: !!w.currentlyWorking,
          description: ctcLabel || null,
          responsibilities: w.reasonForLeaving || null,
        };
      });
  }

  private buildAcademicPayload(v: any): any {
    const gradingType = String(v.gradingType || "").trim();
    const score = v.score;
    let grade: string | null = null;

    if (gradingType === "GRADE") {
      grade = score ? String(score) : null;
    } else if (gradingType === "CGPA") {
      grade = score ? `CGPA ${score}` : "CGPA";
    } else if (gradingType === "PERCENTAGE") {
      grade = score ? `${score}%` : "PERCENTAGE";
    }

    const endDate = v.passingYear ? `${v.passingYear}-01-01` : null;

    return {
      institutionId: v.institutionId || null,
      institutionName: v.institutionName,
      degree: v.degree,
      fieldOfStudy: v.branch,
      startDate: null,
      endDate,
      grade,
      isCurrent: !!v.currentlyStudying,
      description: null,
    };
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

  private extractWorkFromSources(full: any, cachedPayload: any): any[] {
    if (Array.isArray(full?.workExperiences)) return full.workExperiences;
    if (Array.isArray(full?.workExperience)) return full.workExperience;
    if (Array.isArray(full?.workExperienceList)) return full.workExperienceList;
    if (Array.isArray(cachedPayload?.workExperienceList))
      return cachedPayload.workExperienceList;
    return [];
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

  private normalizeGovtIdNumber(value: unknown, govtIdType: unknown): string {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const normalizedType = String(govtIdType || "").toLowerCase();
    if (normalizedType === "aadhaar") {
      return raw
        .replace(/\D/g, "")
        .slice(0, this.getGovtIdNumberMaxLengthByType(normalizedType));
    }

    return raw
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, this.getGovtIdNumberMaxLengthByType(normalizedType));
  }

  private getGovtIdNumberMaxLengthByType(govtIdType: string): number {
    switch (String(govtIdType || "").toLowerCase()) {
      case "aadhaar":
        return 12;
      case "pan card":
        return 10;
      case "passport":
        return 9;
      case "driving license":
        return 16;
      default:
        return 20;
    }
  }

  private getGovtIdPatternByType(govtIdType: string): RegExp {
    switch (String(govtIdType || "").toLowerCase()) {
      case "aadhaar":
        return /^\d{12}$/;
      case "pan card":
        return /^[A-Z]{5}[0-9]{4}[A-Z]$/;
      case "passport":
        return /^[A-Z0-9]{6,9}$/;
      case "driving license":
        return /^[A-Z0-9]{8,16}$/;
      default:
        return /^[A-Z0-9]{4,20}$/;
    }
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

  get workExperienceList(): FormArray<FormGroup> {
    return this.form.get("workExperienceList") as FormArray<FormGroup>;
  }
}
