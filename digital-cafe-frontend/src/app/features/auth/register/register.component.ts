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
  RegisterRequest,
} from "../../../shared/models/auth.model";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: "./register.component.html",
  styleUrl: "./register.component.scss",
})
export class RegisterComponent implements OnInit {

  currentStep = 1;
  totalSteps = 5;
  isLoading = false;
  errorMessage = "";
  successMessage = "";

  // ================= STEP 1 =================
  username = "";
  role = "";

  // ✅ NEW (matches HTML)
  governmentId = {
    type: "",
    number: "",
  };

  // ================= STEP 2 =================
  personalDetails: PersonalDetails = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    maritalStatus: "SINGLE",
  };

  // ================= STEP 3 =================
  address: AddressInfo = {
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  };

  // ================= STEP 4 =================
  academicInfoList: AcademicInfo[] = [
    {
      institutionName: "",
      degree: "",
      passingYear: new Date().getFullYear(),
      grade: "",
      gradeInPercentage: 0,
    },
  ];

  // ================= STEP 5 =================
  workExperienceList: WorkExperience[] = [];

  genderOptions = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
  maritalStatusOptions = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];
  roleOptions = ["CUSTOMER", "CAFE_OWNER"];
  currentYear = new Date().getFullYear();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {}

  // ================= NAVIGATION =================

  nextStep() {
    if (this.validateCurrentStep()) {
      this.currentStep++;
      this.errorMessage = "";
    }
  }

  previousStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  goToStep(step: number) {
    if (step <= this.currentStep) this.currentStep = step;
  }

  // ================= VALIDATION =================

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.validateBasicInfo();
      case 2:
        return this.validatePersonalDetails();
      case 3:
        return this.validateAddress();
      case 4:
        return this.validateAcademicInfo();
      default:
        return true;
    }
  }

  // ✅ UPDATED STEP-1 VALIDATION
  validateBasicInfo(): boolean {
    if (!this.username.trim()) {
      this.errorMessage = "Username is required";
      return false;
    }

    if (!this.role) {
      this.errorMessage = "Please select a role";
      return false;
    }

    if (!this.governmentId.type) {
      this.errorMessage = "Please select Government ID Type";
      return false;
    }

    if (!this.governmentId.number.trim()) {
      this.errorMessage = "Government ID Number is required";
      return false;
    }

    return true;
  }

  validatePersonalDetails(): boolean {
    const pd = this.personalDetails;

    if (!pd.firstName.trim() || !pd.lastName.trim()) {
      this.errorMessage = "First and Last name required";
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(pd.email)) {
      this.errorMessage = "Enter valid email";
      return false;
    }

    return true;
  }

  validateAddress(): boolean {
    if (!this.address.city.trim()) {
      this.errorMessage = "City required";
      return false;
    }
    if (!this.address.pincode.trim()) {
      this.errorMessage = "Pincode required";
      return false;
    }
    return true;
  }

  validateAcademicInfo(): boolean {
    for (let a of this.academicInfoList) {
      if (!a.institutionName.trim() || !a.degree.trim()) {
        this.errorMessage = "Academic details incomplete";
        return false;
      }
    }
    return true;
  }

  // ================= LIST MANAGEMENT =================

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
    if (this.academicInfoList.length > 1)
      this.academicInfoList.splice(index, 1);
  }

  addWorkExperience() {
    this.workExperienceList.push({
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      companyName: "",
      designation: "",
      ctc: { amount: 0, currency: "LPA" },
      reasonForLeaving: "",
    });
  }

  removeWorkExperience(index: number) {
    this.workExperienceList.splice(index, 1);
  }
onCurrentlyWorkingChange(index: number): void {
  const work = this.workExperienceList[index];

  if (work.currentlyWorking) {
    // If currently working → clear end date & reason
    work.endDate = '';
    work.reasonForLeaving = '';
  }
}

  // ================= SUBMIT =================

  onSubmit() {
    if (!this.validateCurrentStep()) return;

    this.isLoading = true;

    const request: RegisterRequest = {
      username: this.username.trim(),
      role: this.role,

      // ✅ NEW — send Govt ID to backend
      governmentIdType: this.governmentId.type,
      governmentIdNumber: this.governmentId.number.trim(),

      personalDetails: this.personalDetails,
      address: this.address,
      academicInfoList: this.academicInfoList,
      workExperienceList: this.workExperienceList,
    };

    this.authService.register(request).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.router.navigate(["/auth/verify-email"]);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "Registration failed";
        this.isLoading = false;
      },
    });
  }

  // ================= UI HELPERS =================

  getStepIcon(step: number): string {
    return step < this.currentStep ? "bi-check-circle-fill" : "bi-circle";
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
