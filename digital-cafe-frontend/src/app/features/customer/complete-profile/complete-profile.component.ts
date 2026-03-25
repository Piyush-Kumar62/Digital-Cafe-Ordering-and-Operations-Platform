import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
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
import { debounceTime, distinctUntilChanged, switchMap, catchError } from "rxjs/operators";
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
export class CompleteProfileComponent {
  loading = false;
  submitted = false;
  form: FormGroup;
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
      govtIdType: [""],
      govtIdNumber: [""],
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
          if (!this.branchOptions.length && this.branchNoticeDegree !== degree) {
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

          return this.educationData.searchInstitutions(normalized).pipe(
            switchMap((results) => of(results)),
          );
        }),
      )
      .subscribe((results) => {
        this.institutionLoading = false;
        this.institutionOptions = results || [];
        const raw = this.form.get("institutionName")?.value;
        const query = String(typeof raw === "string" ? raw : raw?.name || "").trim();
        this.institutionNoResults = query.length >= 2 && (results || []).length === 0;
      });

    this.prefillFromExistingProfile();
  }

  displayInstitution(value: Institution | string): string {
    if (!value) return "";
    return typeof value === "string" ? value : value.name;
  }

  onInstitutionSelected(inst: Institution): void {
    this.form.get("institutionName")?.setValue(inst.name, { emitEvent: false });
    this.form.get("institutionId")?.setValue(inst.id ?? null, { emitEvent: false });
  }

  useTypedInstitution(): void {
    const raw = this.form.get("institutionName")?.value;
    const value = String(typeof raw === "string" ? raw : raw?.name || "").trim();
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
    this.workExperienceList.push(this.createWorkGroup());
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
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || this.submitted);
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
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      phoneNumber: v.phoneNumber,
      govtIdType: v.govtIdType || null,
      govtIdNumber: v.govtIdNumber || null,
      profilePictureUrl: null,
      address: {
        street: v.street,
        plotNumber: v.plotNumber,
        city: v.city,
        state: v.state,
        pincode: v.pincode,
      },
      academicInformation: [
        this.buildAcademicPayload(v),
      ],
      workExperiences: this.buildWorkExperiencePayload(),
    };

    this.http
      .post<{ data?: { completionPercentage?: number } }>(`${environment.apiUrl}/profiles`, payload)
      .subscribe({
        next: (res) => {
          const completionPercentage = res?.data?.completionPercentage ?? 0;
          const isProfileComplete = completionPercentage >= 100;
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            this.authService.updateUserData({
              ...currentUser,
              firstName: v.firstName,
              lastName: v.lastName,
              isProfileComplete,
              profileCompletionPercentage: completionPercentage,
            });
          }

          this.alertService.success("Profile completed successfully.");
          this.router.navigate([isProfileComplete ? "/customer/cafe" : "/customer/complete-profile"]);
        },
        error: (error) => {
          const message = error?.error?.message || "Failed to complete profile.";
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
      basic: this.apiService.getCustomerProfile().pipe(catchError(() => of(null))),
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
            full?.dateOfBirth ||
            basic?.dateOfBirth ||
            "",
          gender:
            full?.gender ||
            basic?.gender ||
            "",
          phoneNumber:
            full?.phoneNumber ||
            basic?.phoneNumber ||
            "",
          govtIdType:
            full?.govtIdType ||
            basic?.govtIdType ||
            "",
          govtIdNumber:
            full?.govtIdNumber ||
            basic?.govtIdNumber ||
            "",
          street: address?.street || "",
          plotNumber: address?.plotNumber || "",
          city: address?.city || "",
          state: address?.state || "",
          pincode: address?.pincode || address?.zipCode || "",
          institutionId:
            academic?.institutionId ?? null,
          institutionName:
            academic?.institutionName || "",
          degree: academic?.degree || "",
          branch:
            academic?.fieldOfStudy ||
            "",
          passingYear:
            (academic?.endDate ? new Date(academic.endDate).getFullYear() : "") ||
            "",
          gradingType:
            this.inferGradingTypeFromProfile(academic?.grade),
          score:
            this.parseGradeFromProfile(academic?.grade) ||
            "",
          currentlyStudying: !!(
            academic?.isCurrent ||
            academic?.isCurrentlyStudying
          ),
        });

        const workList = this.extractWorkFromSources(full, {});
        this.replaceWorkArray(workList);
        this.onAcademicCurrentlyStudyingChange();
      },
      error: () => {
        this.form.patchValue({
          firstName:
            this.authService.currentUserValue?.firstName ||
            "",
          lastName:
            this.authService.currentUserValue?.lastName ||
            "",
          email:
            this.authService.currentUserValue?.email ||
            "",
        });

        const workList = this.extractWorkFromSources(null, {});
        this.replaceWorkArray(workList);
        this.onAcademicCurrentlyStudyingChange();
      },
    });
  }

  private createWorkGroup(initial?: Partial<WorkExperienceFormValue>): FormGroup {
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
      this.workExperienceList.push(this.createWorkGroup());
      return;
    }
    items.forEach((item) => {
      this.workExperienceList.push(
        this.createWorkGroup({
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
        }),
      );
    });
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

    const endDate =
      v.passingYear ? `${v.passingYear}-01-01` : null;

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

  private inferGradingTypeFromProfile(raw?: string): "CGPA" | "PERCENTAGE" | "GRADE" {
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
    if (Array.isArray(cachedPayload?.workExperienceList)) return cachedPayload.workExperienceList;
    return [];
  }


  get workExperienceList(): FormArray<FormGroup> {
    return this.form.get("workExperienceList") as FormArray<FormGroup>;
  }
}
