import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";
import {
  PersonalDetails,
  AddressInfo,
  AcademicInfo,
  WorkExperience,
  CtcInfo,
  ComprehensiveRegisterRequest,
} from "../../../shared/models/auth.model";

@Component({
  selector: "app-comprehensive-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: "./comprehensive-register.component.html",
  styleUrl: "./comprehensive-register.component.scss",
})
export class ComprehensiveRegisterComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  isLoading = false;
  errorMessage = "";
  successMessage = "";

  // Step 1: Basic Info
  username = "";
  password = "";
  confirmPassword = "";
  role = "CUSTOMER";

  // Step 2: Personal Details
  personalDetails: PersonalDetails = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    maritalStatus: "SINGLE",
  };

  // Step 3: Address
  address: AddressInfo = {
    street: "",
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
  roleOptions = ["CUSTOMER", "ADMIN", "CAFE_OWNER", "CHEF", "WAITER"];
  currentYear = new Date().getFullYear();

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    // Any initialization logic
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
    if (!this.username.trim()) {
      this.errorMessage = "Username is required";
      return false;
    }
    if (!this.password || this.password.length < 8) {
      this.errorMessage = "Password must be at least 8 characters";
      return false;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match";
      return false;
    }
    if (!this.role) {
      this.errorMessage = "Please select a role";
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
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";

    // Filter out empty work experiences
    const filteredWorkExperience = this.workExperienceList.filter(
      (work) => work.companyName.trim() && work.designation.trim(),
    );

    const request: ComprehensiveRegisterRequest = {
      username: this.username.trim(),
      password: this.password,
      role: this.role,
      personalDetails: this.personalDetails,
      address: this.address,
      academicInfoList: this.academicInfoList,
      workExperienceList:
        filteredWorkExperience.length > 0 ? filteredWorkExperience : undefined,
    };

    this.authService.register(request).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
        setTimeout(() => {
          this.router.navigate(["/auth/login"]);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || "Registration failed. Please try again.";
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
}
