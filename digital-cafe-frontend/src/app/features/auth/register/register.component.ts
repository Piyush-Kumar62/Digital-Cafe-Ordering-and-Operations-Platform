import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from "rxjs";
import {
  PersonalDetails,
  AddressInfo,
  AcademicInfo,
  WorkExperience,
  CtcInfo,
  RegisterRequest,
  CafeOwnerRegisterRequest,
} from "../../../shared/models/auth.model";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.scss",
})
export class RegisterComponent implements OnInit {
  private static readonly USERNAME_REGEX =
    /^[A-Za-z][A-Za-z0-9._]{2,29}$/;
  readonly customerPanelImage = "assets/coffee/coffee-table-pexels.jpg";
  readonly cafeOwnerPanelImage = "assets/cafe/cafe-ambience.jpg";

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

  // Step 4: Academic Information
  academicInfoList: AcademicInfo[] = [
    {
      institutionName: "",
      degree: "",
      passingYear: new Date().getFullYear(),
      grade: "",
      gradeInPercentage: 0,
      currentlyStudying: false,
    },
  ];

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

  // ── Café Owner Registration ────────────────────────────────────────────────
  // Only active when role === 'CAFE_OWNER'.  The 5-step customer form is hidden.

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

  cafeLogoFile: File | null = null;
  cafeLogoPreview: string | null = null;
  showCafeLogoPreview = false;

  // Café owner step tracking (3 steps)
  cafeCurrentStep = 1;
  cafeTotalSteps = 3;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.preloadImage(this.customerPanelImage);
    this.preloadImage(this.cafeOwnerPanelImage);
    this.usernameControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((value) => {
          this.username = value.trim();
          if (!this.username || this.usernameControl.invalid) {
            this.usernameStatus = "idle";
            if (this.usernameControl.hasError("taken")) {
              const { taken, ...rest } = this.usernameControl.errors || {};
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
            const { taken, ...rest } = currentErrors;
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
  }

  get registerPanelImageSrc(): string {
    return this.isCafeOwnerMode
      ? this.cafeOwnerPanelImage
      : this.customerPanelImage;
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
  }

  // ── Café owner step navigation ─────────────────────────────────────────────
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
      !/^[6-9][0-9]{9}$/.test(this.ownerInfo.ownerPhoneNumber.trim())
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
      !/^[6-9][0-9]{9}$/.test(this.cafeDetails.phoneNumber)
    ) {
      this.errorMessage = "Please enter a valid 10-digit Indian mobile number";
      return false;
    }
    if (!this.cafeDetails.address.trim()) {
      this.errorMessage = "Café address is required";
      return false;
    }
    if (!this.cafeDetails.city.trim()) {
      this.errorMessage = "City is required";
      return false;
    }
    if (
      !this.cafeDetails.pincode.trim() ||
      !/^[0-9]{6}$/.test(this.cafeDetails.pincode)
    ) {
      this.errorMessage = "Please enter a valid 6-digit pincode";
      return false;
    }
    return true;
  }
  // ──────────────────────────────────────────────────────────────────────────

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

  validateCafeOwnerForm(): boolean {
    this.errorMessage = "";

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
    if (!this.cafeDetails.city.trim()) {
      this.errorMessage = "City is required";
      return false;
    }
    if (
      !this.cafeDetails.pincode.trim() ||
      !/^[0-9]{6}$/.test(this.cafeDetails.pincode)
    ) {
      this.errorMessage = "Please enter a valid 6-digit pincode";
      return false;
    }
    if (
      !this.cafeDetails.phoneNumber.trim() ||
      !/^[6-9][0-9]{9}$/.test(this.cafeDetails.phoneNumber)
    ) {
      this.errorMessage = "Please enter a valid 10-digit Indian mobile number";
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
      .registerCafeOwner(payload, this.cafeLogoFile ?? undefined)
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
    let fileList: FileList | null = element.files;
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
    if (!this.govtIdNumber.trim()) {
      this.errorMessage = "Please enter your Government ID number";
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
    const addr = this.address;
    if (!addr.street.trim()) {
      this.errorMessage = "Street address is required";
      return false;
    }
    if (!addr.plotNumber.trim()) {
      this.errorMessage = "Plot number is required";
      return false;
    }
    if (!addr.city.trim()) {
      this.errorMessage = "City is required";
      return false;
    }
    if (!addr.state.trim()) {
      this.errorMessage = "State is required";
      return false;
    }
    if (!addr.pincode.trim()) {
      this.errorMessage = "Pincode is required";
      return false;
    }
    return true;
  }

  validateAcademicInfo(): boolean {
    if (this.academicInfoList.length === 0) {
      this.errorMessage = "At least one academic qualification is required";
      return false;
    }
    for (let i = 0; i < this.academicInfoList.length; i++) {
      const academic = this.academicInfoList[i];
      if (!academic.institutionName.trim()) {
        this.errorMessage = `Institution name is required for qualification ${i + 1}`;
        return false;
      }
      if (!academic.degree.trim()) {
        this.errorMessage = `Degree is required for qualification ${i + 1}`;
        return false;
      }
      if (!academic.grade.trim()) {
        this.errorMessage = `Grade is required for qualification ${i + 1}`;
        return false;
      }
      if (academic.gradeInPercentage <= 0 || academic.gradeInPercentage > 100) {
        this.errorMessage = `Please enter a valid percentage for qualification ${i + 1}`;
        return false;
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
    this.academicInfoList.push({
      institutionName: "",
      degree: "",
      passingYear: new Date().getFullYear(),
      grade: "",
      gradeInPercentage: 0,
      currentlyStudying: false,
    });
  }

  removeAcademic(index: number) {
    if (this.academicInfoList.length > 1) {
      this.academicInfoList.splice(index, 1);
    }
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
      academicInfoList: this.academicInfoList,
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

  private preloadImage(src: string): void {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }

  onPanelImageLoad() {
    this.isPanelImageLoaded = true;
  }

  onPanelImageError() {
    this.isPanelImageLoaded = true;
  }

  onGovtIdTypeChange() {
    if (this.govtIdNumber.trim()) {
      this.govtIdNumber = this.govtIdNumber.trim();
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
      default:
        return null;
    }
  }
}
