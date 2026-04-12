import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  Validators,
  FormBuilder,
  FormGroup,
  FormArray,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { AddressFormComponent } from "../../../shared/components/address-form/address-form.component";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  catchError,
  Subject,
} from "rxjs";
import { filter, takeUntil, tap } from "rxjs/operators";
import {
  PersonalDetails,
  AddressInfo,
  AcademicInfo,
  WorkExperience,
  RegisterRequest,
  CafeOwnerRegisterRequest,
} from "../../../shared/models/auth.model";
import { buildAddressControls } from "../../../shared/forms/address-form.factory";
import { PostalPincodeService } from "../../../shared/services/postal-pincode.service";
import { EducationDataService } from "@shared/services/education-data.service";
import { Institution } from "@shared/models/education.model";
import { TrimInputDirective } from "@shared/directives/trim-input.directive";

interface TimeSlotOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NavbarComponent,
    AddressFormComponent,
    MatAutocompleteModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    TrimInputDirective,
  ],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.scss",
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly registrationCacheKey = "dc_registration_cache_v1";
  private static readonly USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9._]{2,29}$/;
  readonly customerPanelImage =
    "/assets/coffee/coffee-scene-nathan-03.jpg";
  readonly cafeOwnerPanelImage =
    "/assets/cafe/cafe-interior-01.jpg";
  currentCustomerPanelImage = this.customerPanelImage;
  currentCafeOwnerPanelImage = this.cafeOwnerPanelImage;
  panelImageVisible = true;

  currentStep = 1;
  totalSteps = 5;
  isLoading = false;
  errorMessage = "";
  successMessage = "";

  // Step 1: Basic Info
  username = "";
  role = "CUSTOMER";
  govtIdType = "";
  govtIdNumber = "";
  govtIdProof: File | null = null;
  govtIdTypes = ["Aadhaar", "PAN Card", "Driving License", "Passport"];
  usernameControl = new FormControl("", {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(30),
      Validators.pattern(RegisterComponent.USERNAME_REGEX),
    ],
  });
  usernameStatus: "idle" | "checking" | "available" | "taken" = "idle";

  // Step 2: Personal Details
  personalDetails: PersonalDetails = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "SINGLE",
  };

  // Step 3: Address
  address: AddressInfo = {
    street: "",
    plotNumber: "",
    city: "",
    state: "",
    pincode: "",
  };
  addressForm!: FormGroup;
  addressFormSubmitted = false;

  // Step 4: Academic Information
  academicForm!: FormGroup;
  academicSubmitted = false;
  gradingTypes = ["CGPA", "PERCENTAGE", "GRADE"] as const;
  degreeOptions: string[] = [];
  academicBranchOptions: string[][] = [];
  academicBranchLoading: boolean[] = [];
  academicBranchNoticeDegree: string[] = [];
  academicInstitutionOptions: Institution[][] = [];
  academicInstitutionLoading: boolean[] = [];
  academicInstitutionNoResults: boolean[] = [];
  academicYearOptions: number[] = [];
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly postalService = inject(PostalPincodeService);
  private readonly educationData = inject(EducationDataService);

  // Step 5: Work Experience (Optional)
  workExperienceList: WorkExperience[] = [
    {
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      companyName: "",
      designation: "",
      ctc: {
        amount: 0,
        currency: "LPA",
      },
      reasonForLeaving: "",
    },
  ];

  genderOptions = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
  maritalStatusOptions = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];
  currentYear = new Date().getFullYear();
  readonly timeSlotOptions: TimeSlotOption[] = this.buildTimeSlotOptions();

  // Café Owner Registration  // Only active when role === 'CAFE_OWNER'.  The 5-step customer form is hidden.

  isCafeOwnerMode = false;
  isPanelImageLoaded = false;

  ownerInfo = {
    firstName: "",
    lastName: "",
    email: "",
    ownerPhoneNumber: "", // personal mobile number
  };

  cafeDetails = {
    cafeName: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phoneNumber: "",
    openTime: "",
    closeTime: "",
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

  cafeLogoFile: File | null = null;
  cafeLogoPreview: string | null = null;
  showCafeLogoPreview = false;
  cafeGalleryFiles: File[] = [];
  cafeGalleryPreviews: string[] = [];

  private readonly gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  private readonly msmeRegex = /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;
  private readonly indianMobileRegex = /^[6-9][0-9]{9}$/;

  // Café owner step tracking (3 steps)
  cafeCurrentStep = 1;
  cafeTotalSteps = 3;

  ngOnInit() {
    this.addressForm = this.fb.group(buildAddressControls());
    this.addressForm.patchValue(this.address);
    this.academicForm = this.fb.group({
      items: this.fb.array([this.createAcademicGroup()]),
    });
    this.educationData
      .getDegreeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((options) => {
        this.degreeOptions = options;
      });
    if (this.academicItems.length) {
      this.initializeAcademicGroup(this.academicItems.at(0) as FormGroup);
    }
    this.academicYearOptions = this.buildYearOptions(1950);
    this.currentCustomerPanelImage = this.customerPanelImage;
    this.currentCafeOwnerPanelImage = this.cafeOwnerPanelImage;
    this.panelImageVisible = true;
    this.usernameControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((value) => {
          this.username = value.trim();
          if (!this.username || this.usernameControl.invalid) {
            this.usernameStatus = "idle";
            if (this.usernameControl.hasError("taken")) {
              const rest = { ...(this.usernameControl.errors || {}) };
              delete rest["taken"];
              this.usernameControl.setErrors(
                Object.keys(rest).length ? rest : null,
              );
            }
            return of(null);
          }
          this.usernameStatus = "checking";
          return this.authService
            .checkUsernameAvailability(this.username)
            .pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((result) => {
        if (!result) return;
        this.usernameStatus = result.available ? "available" : "taken";
        const currentErrors = this.usernameControl.errors || {};
        if (result.available) {
          if (currentErrors["taken"]) {
            const rest = { ...currentErrors };
            delete rest["taken"];
            this.usernameControl.setErrors(
              Object.keys(rest).length ? rest : null,
            );
          }
        } else {
          this.usernameControl.setErrors({ ...currentErrors, taken: true });
        }
      });
    this.route.data.subscribe((data) => {
      const role = String(data?.["role"] || "").toUpperCase();
      if (role !== "CUSTOMER" && role !== "CAFE_OWNER") {
        this.router.navigate(["/auth/register"]);
        return;
      }
      this.applyRole(role as "CUSTOMER" | "CAFE_OWNER");
    });

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

          if (!this.cafeDetails.city && result.data.cities.length === 1) {
            this.cafeDetails.city = result.data.cities[0];
          }
          if (!this.cafeDetails.state && result.data.states.length === 1) {
            this.cafeDetails.state = result.data.states[0];
          }
          return;
        }

        this.cafePincodeNotFound = result.status === "not_found";
        this.cafePincodeError = result.status === "error";
        this.cafeCityOptions = [];
        this.cafeStateOptions = [];
      });
  }

  get academicItems(): FormArray<FormGroup> {
    return this.academicForm.get("items") as FormArray<FormGroup>;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get registerPanelImageSrc(): string {
    return this.isCafeOwnerMode
      ? this.currentCafeOwnerPanelImage
      : this.currentCustomerPanelImage;
  }

  get registerPanelImageAlt(): string {
    return this.isCafeOwnerMode
      ? "Barista crafting coffee for cafe owner registration"
      : "Coffee cups on table for customer registration";
  }

  private applyRole(role: "CUSTOMER" | "CAFE_OWNER") {
    this.role = role;
    this.isCafeOwnerMode = role === "CAFE_OWNER";
    this.isPanelImageLoaded = false;
    this.currentStep = 1;
    this.cafeCurrentStep = 1;
    this.errorMessage = "";
    this.successMessage = "";
    this.panelImageVisible = true;
    this.currentCustomerPanelImage = this.customerPanelImage;
    this.currentCafeOwnerPanelImage = this.cafeOwnerPanelImage;
  }

  // Cafe owner step navigation
  cafeNextStep() {
    if (this.validateCafeStep(this.cafeCurrentStep)) {
      this.cafeCurrentStep++;
      this.errorMessage = "";
    } else {
      this.alertService.warning("Validation Error", this.errorMessage);
    }
  }

  cafePreviousStep() {
    if (this.cafeCurrentStep > 1) {
      this.cafeCurrentStep--;
      this.errorMessage = "";
    }
  }

  getCafeStepIcon(step: number): string {
    if (step < this.cafeCurrentStep) return "bi-check-circle-fill";
    if (step === this.cafeCurrentStep) return "bi-circle-fill";
    return "bi-circle";
  }

  getCafeStepClass(step: number): string {
    if (step < this.cafeCurrentStep) return "completed";
    if (step === this.cafeCurrentStep) return "active";
    return "pending";
  }

  validateCafeStep(step: number): boolean {
    this.errorMessage = "";
    switch (step) {
      case 1:
        return this.validateCafeStep1();
      case 2:
        return this.validateCafeStep2();
      default:
        return true; // step 3 is all optional
    }
  }

  validateCafeStep1(): boolean {
    if (!this.ownerInfo.firstName.trim() || !this.ownerInfo.lastName.trim()) {
      this.errorMessage = "First name and last name are required";
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.ownerInfo.email || !emailRegex.test(this.ownerInfo.email)) {
      this.errorMessage = "Please enter a valid email address";
      return false;
    }
    // ownerPhoneNumber is optional; validate format if provided
    if (
      this.ownerInfo.ownerPhoneNumber.trim() &&
      !this.indianMobileRegex.test(this.ownerInfo.ownerPhoneNumber.trim())
    ) {
      this.errorMessage = "Please enter a valid 10-digit Indian mobile number";
      return false;
    }
    return true;
  }

  validateCafeStep2(): boolean {
    if (!this.cafeDetails.cafeName.trim()) {
      this.errorMessage = "Café name is required";
      return false;
    }
    if (
      !this.cafeDetails.phoneNumber.trim() ||
      !this.indianMobileRegex.test(this.cafeDetails.phoneNumber)
    ) {
      this.errorMessage = "Please enter a valid 10-digit Indian mobile number";
      return false;
    }
    if (!this.cafeDetails.address.trim()) {
      this.errorMessage = "Café address is required";
      return false;
    }
    if (
      !this.cafeDetails.pincode.trim() ||
      !/^[0-9]{6}$/.test(this.cafeDetails.pincode)
    ) {
      this.errorMessage = "Please enter a valid 6-digit pincode";
      return false;
    }
    if (!this.cafeDetails.city.trim()) {
      this.errorMessage = "City is required";
      return false;
    }
    if (!this.cafeDetails.openTime) {
      this.errorMessage = "Opening time is required";
      return false;
    }
    if (!this.cafeDetails.closeTime) {
      this.errorMessage = "Closing time is required";
      return false;
    }
    if (
      this.cafeDetails.openTime &&
      this.cafeDetails.closeTime &&
      this.cafeDetails.openTime === this.cafeDetails.closeTime
    ) {
      this.errorMessage = "Opening and closing time cannot be the same";
      return false;
    }
    return true;
  }
  //
  onCafeLogoSelect(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const twoMb = 2 * 1024 * 1024;
      if (file.size > twoMb) {
        this.errorMessage = "Cafe logo must be 2MB or less";
        input.value = "";
        return;
      }
      this.cafeLogoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.cafeLogoPreview = e.target?.result as string;
        this.showCafeLogoPreview = true;
      };
      reader.readAsDataURL(this.cafeLogoFile);
    }
  }

  onCafeGallerySelect(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const selected = Array.from(input.files || []);
    if (!selected.length) return;

    const remaining = Math.max(0, 8 - this.cafeGalleryFiles.length);
    if (remaining === 0) {
      this.alertService.warning(
        "Gallery limit reached",
        "You can upload up to 8 gallery images.",
      );
      input.value = "";
      return;
    }

    const accepted = selected.slice(0, remaining);
    for (const file of accepted) {
      const isImage = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.type);
      if (!isImage) {
        this.alertService.error(
          "Only JPG, PNG, WEBP, or GIF images are allowed for gallery.",
        );
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error("Each gallery image must be 5MB or less.");
        continue;
      }

      this.cafeGalleryFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = String(e.target?.result || "");
        if (src) this.cafeGalleryPreviews.push(src);
      };
      reader.readAsDataURL(file);
    }

    input.value = "";
  }

  removeCafeGalleryImage(index: number): void {
    if (index < 0 || index >= this.cafeGalleryFiles.length) return;
    this.cafeGalleryFiles.splice(index, 1);
    this.cafeGalleryPreviews.splice(index, 1);
  }

  onCafeFssaiInput(value: string): void {
    this.cafeDetails.fssaiNumber = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 14);
  }

  onCafeGstInput(value: string): void {
    this.cafeDetails.gstNumber = String(value || "")
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(0, 15);
  }

  onCafeMsmeInput(value: string): void {
    this.cafeDetails.msmeNumber = String(value || "")
      .toUpperCase()
      .replace(/[^0-9A-Z-]/g, "")
      .slice(0, 19);
  }

  onOwnerPhoneInput(value: string): void {
    this.ownerInfo.ownerPhoneNumber = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  onCafeBusinessPhoneInput(value: string): void {
    this.cafeDetails.phoneNumber = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  validateCafeOwnerForm(): boolean {
    this.errorMessage = "";
    this.normalizeComplianceNumbers();

    if (!this.ownerInfo.firstName.trim() || !this.ownerInfo.lastName.trim()) {
      this.errorMessage = "First name and last name are required";
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.ownerInfo.email || !emailRegex.test(this.ownerInfo.email)) {
      this.errorMessage = "Please enter a valid email address";
      return false;
    }
    if (!this.cafeDetails.cafeName.trim()) {
      this.errorMessage = "Café name is required";
      return false;
    }
    if (!this.cafeDetails.address.trim()) {
      this.errorMessage = "Café address is required";
      return false;
    }
    if (
      !this.cafeDetails.pincode.trim() ||
      !/^[0-9]{6}$/.test(this.cafeDetails.pincode)
    ) {
      this.errorMessage = "Please enter a valid 6-digit pincode";
      return false;
    }
    if (!this.cafeDetails.city.trim()) {
      this.errorMessage = "City is required";
      return false;
    }
    if (
      !this.cafeDetails.phoneNumber.trim() ||
      !this.indianMobileRegex.test(this.cafeDetails.phoneNumber)
    ) {
      this.errorMessage = "Please enter a valid 10-digit Indian mobile number";
      return false;
    }
    if (!this.cafeDetails.openTime) {
      this.errorMessage = "Opening time is required";
      return false;
    }
    if (!this.cafeDetails.closeTime) {
      this.errorMessage = "Closing time is required";
      return false;
    }
    if (this.cafeDetails.openTime === this.cafeDetails.closeTime) {
      this.errorMessage = "Opening and closing time cannot be the same";
      return false;
    }
    if (
      this.cafeDetails.fssaiNumber &&
      !/^\d{14}$/.test(this.cafeDetails.fssaiNumber)
    ) {
      this.errorMessage = "FSSAI number must be exactly 14 digits";
      return false;
    }
    if (
      this.cafeDetails.gstNumber &&
      !this.gstRegex.test(this.cafeDetails.gstNumber)
    ) {
      this.errorMessage = "GST number must be a valid 15-character GSTIN";
      return false;
    }
    if (
      this.cafeDetails.msmeNumber &&
      !this.msmeRegex.test(this.cafeDetails.msmeNumber)
    ) {
      this.errorMessage = "MSME number must be in UDYAM-XX-00-0000000 format";
      return false;
    }
    return true;
  }

  onCafeOwnerSubmit() {
    if (!this.validateCafeOwnerForm()) {
      this.alertService.warning("Validation Error", this.errorMessage);
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.alertService.loading("Creating your café account. Please wait.");

    const payload: CafeOwnerRegisterRequest = {
      firstName: this.ownerInfo.firstName.trim(),
      lastName: this.ownerInfo.lastName.trim(),
      email: this.ownerInfo.email.trim(),
      ownerPhoneNumber: this.ownerInfo.ownerPhoneNumber.trim() || undefined,
      cafeName: this.cafeDetails.cafeName.trim(),
      description: this.cafeDetails.description.trim() || undefined,
      address: this.cafeDetails.address.trim(),
      city: this.cafeDetails.city.trim(),
      state: this.cafeDetails.state.trim() || undefined,
      pincode: this.cafeDetails.pincode.trim(),
      phoneNumber: this.cafeDetails.phoneNumber.trim(),
      openTime: this.cafeDetails.openTime || undefined,
      closeTime: this.cafeDetails.closeTime || undefined,
      fssaiNumber: this.cafeDetails.fssaiNumber.trim() || undefined,
      gstNumber: this.cafeDetails.gstNumber.trim() || undefined,
      msmeNumber: this.cafeDetails.msmeNumber.trim() || undefined,
    };

    this.authService
      .registerCafeOwner(
        payload,
        this.cafeLogoFile ?? undefined,
        this.cafeGalleryFiles,
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.alertService.close();
          this.successMessage =
            response.message ||
            "Registration successful! Please verify your email.";
          this.alertService.success(
            "Registration Successful",
            this.successMessage,
          );
          this.cacheRegistrationPayload(payload.email, "owner", payload);
          setTimeout(() => {
            this.router.navigate(["/auth/login"]);
          }, 2500);
        },
        error: (error) => {
          this.isLoading = false;
          this.alertService.close();
          this.errorMessage =
            error.message || "Registration failed. Please try again.";
          this.alertService.error("Registration Failed", this.errorMessage);
        },
      });
  }

  onFileSelect(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList) {
      const file = fileList[0];
      const twoMb = 2 * 1024 * 1024;
      if (file.size > twoMb) {
        this.errorMessage = "Government ID file must be 2MB or less";
        this.govtIdProof = null;
        element.value = "";
        return;
      }
      if (this.errorMessage === "Government ID file must be 2MB or less") {
        this.errorMessage = "";
      }
      this.govtIdProof = file;
    }
  }

  onCafePincodeInput(value: string) {
    this.cafePincode$.next(value);
  }

  // Navigation methods
  nextStep() {
    if (this.validateCurrentStep()) {
      this.currentStep++;
      this.errorMessage = "";
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = "";
    }
  }

  goToStep(step: number) {
    if (step <= this.currentStep || this.validateStepRange(step)) {
      this.currentStep = step;
      this.errorMessage = "";
    }
  }

  // Validation methods
  validateCurrentStep(): boolean {
    this.errorMessage = "";

    switch (this.currentStep) {
      case 1:
        return this.validateBasicInfo();
      case 2:
        return this.validatePersonalDetails();
      case 3:
        return this.validateAddress();
      case 4:
        return this.validateAcademicInfo();
      case 5:
        return this.validateWorkExperience();
      default:
        return true;
    }
  }

  validateBasicInfo(): boolean {
    this.username = this.usernameControl.value.trim();
    if (this.usernameControl.invalid || !this.username.trim()) {
      this.usernameControl.markAsTouched();
      this.errorMessage = "Username is required";
      return false;
    }
    if (this.usernameControl.hasError("taken")) {
      this.errorMessage = "Username already taken";
      return false;
    }
    if (this.role !== "CUSTOMER" && this.role !== "CAFE_OWNER") {
      this.errorMessage =
        "Only CUSTOMER or CAFE OWNER roles are valid for registration";
      return false;
    }
    if (!this.govtIdType) {
      this.errorMessage = "Please select a Government ID type";
      return false;
    }
    this.govtIdNumber = this.normalizeGovtIdNumber(
      this.govtIdNumber,
      this.govtIdType,
    );
    if (!this.govtIdNumber.trim()) {
      this.errorMessage = "Please enter your Government ID number";
      return false;
    }
    if (!this.isValidGovtIdNumber(this.govtIdNumber, this.govtIdType)) {
      this.errorMessage = this.getGovtIdValidationMessage(this.govtIdType);
      return false;
    }
    if (!this.govtIdProof) {
      this.errorMessage = "Please upload your Government ID proof";
      return false;
    }
    return true;
  }

  validatePersonalDetails(): boolean {
    const pd = this.personalDetails;
    pd.phone = this.normalizeIndianPhone(pd.phone);
    if (!pd.firstName.trim() || !pd.lastName.trim()) {
      this.errorMessage = "First name and last name are required";
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pd.email || !emailRegex.test(pd.email)) {
      this.errorMessage = "Please enter a valid email address";
      return false;
    }
    if (!pd.phone.trim()) {
      this.errorMessage = "Phone number is required";
      return false;
    }
    if (!/^[0-9]{10}$/.test(pd.phone.trim())) {
      this.errorMessage = "Please enter a valid 10-digit phone number";
      return false;
    }
    if (!pd.dateOfBirth) {
      this.errorMessage = "Date of birth is required";
      return false;
    }
    if (!pd.gender) {
      this.errorMessage = "Please select gender";
      return false;
    }
    return true;
  }

  validateAddress(): boolean {
    this.addressFormSubmitted = true;
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      this.errorMessage = "Please complete your address details";
      return false;
    }
    this.syncAddressFromForm();
    return true;
  }

  validateAcademicInfo(): boolean {
    this.academicSubmitted = true;
    if (this.academicItems.length === 0) {
      this.errorMessage = "At least one academic qualification is required";
      return false;
    }

    this.academicItems.markAllAsTouched();

    for (let i = 0; i < this.academicItems.length; i++) {
      const group = this.academicItems.at(i);
      const institutionValue = group.get("institutionName")?.value;
      const institution = String(
        typeof institutionValue === "string"
          ? institutionValue
          : institutionValue?.name || "",
      ).trim();
      const degree = String(group.get("degree")?.value || "").trim();
      const branch = String(group.get("branch")?.value || "").trim();
      const gradingType = String(group.get("gradingType")?.value || "").trim();
      const score = group.get("score")?.value;
      const passingYear = Number(group.get("passingYear")?.value || 0);
      const currentlyStudying = !!group.get("currentlyStudying")?.value;

      if (!institution) {
        this.errorMessage = `Institution name is required for qualification ${i + 1}`;
        return false;
      }
      if (!degree) {
        this.errorMessage = `Degree is required for qualification ${i + 1}`;
        return false;
      }
      if (!branch) {
        this.errorMessage = `Branch/stream is required for qualification ${i + 1}`;
        return false;
      }
      if (!gradingType) {
        this.errorMessage = `Select grading system for qualification ${i + 1}`;
        return false;
      }
      if (!currentlyStudying) {
        if (passingYear < 1950 || passingYear > this.currentYear) {
          this.errorMessage = `Please select a valid completion year for qualification ${i + 1}`;
          return false;
        }
      }

      if (gradingType === "GRADE") {
        if (!String(score || "").trim()) {
          this.errorMessage = `Enter grade for qualification ${i + 1}`;
          return false;
        }
      } else if (gradingType === "CGPA") {
        const numericScore = Number(score);
        if (!numericScore || numericScore <= 0 || numericScore > 10) {
          this.errorMessage = `Enter a valid CGPA (0-10) for qualification ${i + 1}`;
          return false;
        }
      } else if (gradingType === "PERCENTAGE") {
        const numericScore = Number(score);
        if (!numericScore || numericScore <= 0 || numericScore > 100) {
          this.errorMessage = `Enter a valid percentage (0-100) for qualification ${i + 1}`;
          return false;
        }
      }
    }

    return true;
  }

  validateWorkExperience(): boolean {
    // Work experience is optional, so just validate format if provided
    for (let i = 0; i < this.workExperienceList.length; i++) {
      const work = this.workExperienceList[i];
      if (work.companyName.trim() || work.designation.trim()) {
        if (!work.companyName.trim()) {
          this.errorMessage = `Company name is required for experience ${i + 1}`;
          return false;
        }
        if (!work.designation.trim()) {
          this.errorMessage = `Designation is required for experience ${i + 1}`;
          return false;
        }
        if (!work.startDate) {
          this.errorMessage = `Start date is required for experience ${i + 1}`;
          return false;
        }
      }
    }
    return true;
  }

  validateStepRange(step: number): boolean {
    return step >= 1 && step <= this.totalSteps;
  }

  // Academic Info management
  addAcademic() {
    const group = this.createAcademicGroup();
    this.academicItems.push(group);
    this.initializeAcademicGroup(group);
  }

  removeAcademic(index: number) {
    if (this.academicItems.length <= 1) return;
    const ok = confirm("Remove this qualification?");
    if (!ok) return;
    this.academicItems.removeAt(index);
    this.academicBranchOptions.splice(index, 1);
    this.academicInstitutionOptions.splice(index, 1);
    this.academicInstitutionLoading.splice(index, 1);
    this.academicInstitutionNoResults.splice(index, 1);
    this.academicBranchNoticeDegree.splice(index, 1);
  }

  // Work Experience management
  addWorkExperience() {
    this.workExperienceList.push({
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      companyName: "",
      designation: "",
      ctc: {
        amount: 0,
        currency: "LPA",
      },
      reasonForLeaving: "",
    });
  }

  removeWorkExperience(index: number) {
    this.workExperienceList.splice(index, 1);
  }

  onCurrentlyWorkingChange(index: number) {
    if (this.workExperienceList[index].currentlyWorking) {
      this.workExperienceList[index].endDate = "";
      this.workExperienceList[index].reasonForLeaving = "";
    }
  }

  onAcademicCurrentlyStudyingChange(index: number) {
    const group = this.academicItems.at(index);
    const isCurrent = !!group.get("currentlyStudying")?.value;
    const yearControl = group.get("passingYear");
    if (!yearControl) return;
    if (isCurrent) {
      yearControl.disable();
      yearControl.setValue(this.currentYear);
    } else {
      yearControl.enable();
    }
  }

  // Submit registration
  onSubmit() {
    if (!this.validateCurrentStep()) {
      if (this.errorMessage) {
        this.alertService.warning("Validation Error", this.errorMessage);
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.alertService.loading("Creating your account. Please wait.");

    this.syncAddressFromForm();

    // Filter out empty work experiences
    const filteredWorkExperience = this.workExperienceList.filter(
      (work) => work.companyName.trim() && work.designation.trim(),
    );

    const payload: RegisterRequest = {
      username: this.username.trim(),
      role: this.role,
      govtIdType: this.govtIdType,
      govtIdNumber: this.govtIdNumber.trim(),
      personalDetails: this.personalDetails,
      address: this.address,
      academicInfoList: this.buildAcademicPayload(),
      workExperienceList:
        filteredWorkExperience.length > 0 ? filteredWorkExperience : undefined,
    };

    const request$ = this.govtIdProof
      ? this.authService.registerWithGovtId(payload, this.govtIdProof)
      : this.authService.register(payload);

    request$.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.alertService.close();
        this.successMessage =
          response.message ||
          "Registration successful. Awaiting admin approval.";
        this.alertService.success(
          "Registration Successful",
          this.successMessage,
        );
        this.cacheRegistrationPayload(
          payload.personalDetails.email,
          "customer",
          payload,
        );
        setTimeout(() => {
          this.router.navigate(["/auth/login"]);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.alertService.close();
        this.errorMessage =
          error.message || "Registration failed. Please try again.";
        this.alertService.error("Registration Failed", this.errorMessage);
      },
    });
  }

  // Utility methods
  getStepIcon(step: number): string {
    if (step < this.currentStep) return "bi-check-circle-fill";
    if (step === this.currentStep) return "bi-circle-fill";
    return "bi-circle";
  }

  getStepClass(step: number): string {
    if (step < this.currentStep) return "completed";
    if (step === this.currentStep) return "active";
    return "pending";
  }

  isStepAccessible(step: number): boolean {
    return step <= this.currentStep;
  }

  onPanelImageLoad() {
    this.isPanelImageLoaded = true;
  }

  onPanelImageError() {
    this.isPanelImageLoaded = true;
    this.panelImageVisible = true;
    if (this.isCafeOwnerMode) {
      if (this.currentCafeOwnerPanelImage === this.cafeOwnerPanelImage) return;
      this.currentCafeOwnerPanelImage = this.cafeOwnerPanelImage;
      return;
    }
    if (this.currentCustomerPanelImage === this.customerPanelImage) return;
    this.currentCustomerPanelImage = this.customerPanelImage;
  }

  onGovtIdTypeChange() {
    this.govtIdNumber = this.normalizeGovtIdNumber(
      this.govtIdNumber,
      this.govtIdType,
    );
  }

  onGovtIdNumberInput(value: string): void {
    this.govtIdNumber = this.normalizeGovtIdNumber(value, this.govtIdType);
  }

  onCustomerPhoneInput(value: string): void {
    this.personalDetails.phone = this.normalizeIndianPhone(value);
  }

  private cacheRegistrationPayload(
    email: string,
    role: "customer" | "owner",
    payload: any,
  ): void {
    const key = String(email || "")
      .trim()
      .toLowerCase();
    if (!key) return;
    try {
      const raw = localStorage.getItem(this.registrationCacheKey);
      const existing = raw ? JSON.parse(raw) : {};
      existing[key] = {
        role,
        payload,
        savedAt: Date.now(),
      };
      localStorage.setItem(this.registrationCacheKey, JSON.stringify(existing));
    } catch {
      // ignore storage errors
    }
  }

  get govtIdNumberPlaceholder(): string {
    switch ((this.govtIdType || "").toLowerCase()) {
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
    switch ((this.govtIdType || "").toLowerCase()) {
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

  private normalizeIndianPhone(value: string): string {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  }

  private normalizeGovtIdNumber(value: string, govtIdType: string): string {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const normalizedType = String(govtIdType || "").toLowerCase();
    if (normalizedType === "aadhaar") {
      return raw.replace(/\D/g, "").slice(0, this.govtIdNumberMaxLength || 20);
    }

    return raw
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, this.govtIdNumberMaxLength || 20);
  }

  private isValidGovtIdNumber(value: string, govtIdType: string): boolean {
    const id = String(value || "").trim();
    if (!id) return false;

    switch (String(govtIdType || "").toLowerCase()) {
      case "aadhaar":
        return /^\d{12}$/.test(id);
      case "pan card":
        return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(id);
      case "passport":
        return /^[A-Z0-9]{6,9}$/.test(id);
      case "driving license":
        return /^[A-Z0-9]{8,16}$/.test(id);
      default:
        return /^[A-Z0-9]{4,20}$/.test(id);
    }
  }

  private getGovtIdValidationMessage(govtIdType: string): string {
    switch (String(govtIdType || "").toLowerCase()) {
      case "aadhaar":
        return "Aadhaar must be exactly 12 digits.";
      case "pan card":
        return "PAN must be 10 characters in format AAAAA9999A.";
      case "passport":
        return "Passport number must be 6 to 9 alphanumeric characters.";
      case "driving license":
        return "Driving License must be 8 to 16 alphanumeric characters.";
      default:
        return "Government ID must be 4 to 20 valid characters.";
    }
  }

  isAcademicInvalid(index: number, field: string): boolean {
    const group = this.academicItems.at(index);
    const control = group?.get(field);
    return !!(
      control &&
      control.invalid &&
      (control.touched || this.academicSubmitted)
    );
  }

  academicScoreError(index: number): string {
    const group = this.academicItems.at(index);
    if (!group) return "";
    const scoreCtrl = group.get("score");
    const gradingType = String(group.get("gradingType")?.value || "").trim();
    const show = !!(scoreCtrl?.touched || this.academicSubmitted);
    if (!show) return "";

    const raw = scoreCtrl?.value;
    if (gradingType === "GRADE") {
      return String(raw || "").trim() ? "" : "Grade is required.";
    }

    const numeric = Number(raw);
    if (!raw || Number.isNaN(numeric)) {
      return gradingType === "PERCENTAGE"
        ? "Percentage is required."
        : "CGPA is required.";
    }

    if (gradingType === "CGPA") {
      return numeric > 0 && numeric <= 10
        ? ""
        : "Enter a CGPA between 0 and 10.";
    }

    if (gradingType === "PERCENTAGE") {
      return numeric > 0 && numeric <= 100
        ? ""
        : "Enter a percentage between 0 and 100.";
    }

    return "";
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
    const group = this.academicItems.at(index);
    if (!group) return;
    group.get("institutionName")?.setValue(inst.name, { emitEvent: false });
    group.get("institutionId")?.setValue(inst.id ?? null, { emitEvent: false });
  }

  useTypedInstitution(index: number): void {
    const group = this.academicItems.at(index);
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
      .get("institutionName")
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((value) => {
          const idx = this.getAcademicIndex(group);
          if (idx < 0) return;
          const query = typeof value === "string" ? value : value?.name || "";
          const normalized = String(query || "").trim();
          this.academicInstitutionLoading[idx] = normalized.length >= 2;
          this.academicInstitutionNoResults[idx] = false;
          this.academicInstitutionOptions[idx] = [];
          group.get("institutionId")?.setValue(null, { emitEvent: false });
        }),
        switchMap((value) => {
          const query = typeof value === "string" ? value : value?.name || "";
          const normalized = String(query || "").trim();
          if (normalized.length < 2) {
            const idx = this.getAcademicIndex(group);
            if (idx >= 0) {
              this.academicInstitutionLoading[idx] = false;
              this.academicInstitutionNoResults[idx] = false;
            }
            return of([]);
          }
          return this.educationData
            .searchInstitutions(normalized)
            .pipe(catchError(() => of([])));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((results) => {
        const idx = this.getAcademicIndex(group);
        if (idx < 0) return;
        this.academicInstitutionLoading[idx] = false;
        this.academicInstitutionOptions[idx] = results || [];
        const raw = group.get("institutionName")?.value;
        const query = String(
          typeof raw === "string" ? raw : raw?.name || "",
        ).trim();
        this.academicInstitutionNoResults[idx] =
          query.length >= 2 && (results || []).length === 0;
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
    return this.academicItems.controls.indexOf(group);
  }

  private createAcademicGroup(): FormGroup {
    return this.fb.group({
      institutionId: [null],
      institutionName: ["", [Validators.required, Validators.maxLength(200)]],
      degree: ["", Validators.required],
      branch: ["", Validators.required],
      passingYear: ["", Validators.required],
      gradingType: ["CGPA", Validators.required],
      score: [null],
      currentlyStudying: [false],
    });
  }

  private buildAcademicPayload(): AcademicInfo[] {
    interface AcademicFormValue {
      institutionId?: number | null;
      institutionName: string | Institution;
      degree: string;
      branch: string;
      passingYear: number;
      gradingType: string;
      score: string | number | null;
      currentlyStudying: boolean;
    }

    const items = this.academicItems.getRawValue() as AcademicFormValue[];

    return items.map((item) => {
      const gradingType = String(item.gradingType || "").trim();
      const score = item.score;
      let grade = "";
      let gradeInPercentage = 0;

      if (gradingType === "GRADE") {
        grade = String(score || "").trim();
        gradeInPercentage = 0;
      } else if (gradingType === "CGPA") {
        grade = "CGPA";
        gradeInPercentage = Number(score || 0);
      } else {
        grade = "PERCENTAGE";
        gradeInPercentage = Number(score || 0);
      }

      const institutionValue = item.institutionName;
      const institutionName = String(
        typeof institutionValue === "string"
          ? institutionValue
          : institutionValue?.name || "",
      ).trim();

      return {
        institutionId: item.institutionId ?? undefined,
        institutionName,
        degree: String(item.degree || "").trim(),
        branch: String(item.branch || "").trim() || undefined,
        passingYear: Number(item.passingYear || this.currentYear),
        grade,
        gradeInPercentage,
        currentlyStudying: !!item.currentlyStudying,
      } as AcademicInfo;
    });
  }

  private buildYearOptions(minYear: number): number[] {
    const years: number[] = [];
    for (let y = this.currentYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }

  private syncAddressFromForm(): void {
    const raw = this.addressForm.getRawValue();
    this.address = {
      street: String(raw.street || "").trim(),
      plotNumber: String(raw.plotNumber || "").trim(),
      city: String(raw.city || "").trim(),
      state: String(raw.state || "").trim(),
      pincode: String(raw.pincode || "").trim(),
    };
  }

  private buildTimeSlotOptions(): TimeSlotOption[] {
    const slots: TimeSlotOption[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const period = hour < 12 ? "AM" : "PM";
      slots.push({
        value: `${String(hour).padStart(2, "0")}:00`,
        label: `${displayHour}:00 ${period}`,
      });
    }
    return slots;
  }

  private normalizeComplianceNumbers(): void {
    this.cafeDetails.fssaiNumber = String(this.cafeDetails.fssaiNumber || "")
      .replace(/\D/g, "")
      .slice(0, 14);

    this.cafeDetails.gstNumber = String(this.cafeDetails.gstNumber || "")
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(0, 15);

    this.cafeDetails.msmeNumber = String(this.cafeDetails.msmeNumber || "")
      .toUpperCase()
      .replace(/[^0-9A-Z-]/g, "")
      .slice(0, 19);
  }
}
