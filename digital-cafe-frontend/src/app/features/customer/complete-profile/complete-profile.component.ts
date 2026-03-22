import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
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
import { AddressFormComponent } from "@shared/components/address-form/address-form.component";
import { buildAddressControls } from "@shared/forms/address-form.factory";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { EducationDataService } from "@shared/services/education-data.service";
import { Institution } from "@shared/models/education.model";
import { debounceTime, distinctUntilChanged, switchMap } from "rxjs/operators";
import { of } from "rxjs";

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private educationData: EducationDataService,
  ) {
    this.form = this.fb.group({
      firstName: ["", [Validators.required, Validators.maxLength(50)]],
      lastName: ["", [Validators.required, Validators.maxLength(50)]],
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
      ...buildAddressControls({
        includeCountry: true,
        requireState: true,
        pincodePattern: /^[0-9]{6}$/,
      }),
      institutionId: [null],
      institutionName: ["", Validators.required],
      degree: ["", Validators.required],
      fieldOfStudy: ["", Validators.required],
      academicStartDate: [""],
      academicEndDate: [""],
      grade: [""],
      isCurrent: [false],
    });

    this.educationData.getDegreeOptions().subscribe((options) => {
      this.degreeOptions = options;
    });

    this.form
      .get("degree")
      ?.valueChanges.pipe(distinctUntilChanged())
      .subscribe((value) => {
        const degree = String(value || "");
        if (!degree) {
          this.branchOptions = [];
          this.branchLoading = false;
          this.form.get("fieldOfStudy")?.setValue("");
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
        this.form.get("fieldOfStudy")?.setValue("");
      });

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
    const v = this.form.value;
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      phoneNumber: v.phoneNumber,
      profilePictureUrl: null,
      address: {
        street: v.street,
        plotNumber: v.plotNumber,
        city: v.city,
        state: v.state,
        country: v.country,
        pincode: v.pincode,
      },
      academicInformation: [
        {
          institutionId: v.institutionId || null,
          institutionName: v.institutionName,
          degree: v.degree,
          fieldOfStudy: v.fieldOfStudy,
          startDate: v.academicStartDate || null,
          endDate: v.academicEndDate || null,
          grade: v.grade || null,
          isCurrent: !!v.isCurrent,
          description: null,
        },
      ],
      workExperiences: [],
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
}


