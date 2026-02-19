export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  profileCompletionPercentage: number;
  isActive: boolean;
  cafeId?: number;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  roles: string[];
  isEmailVerified: boolean;
  isProfileComplete: boolean;
  profileCompletionPercentage: number;
  mustResetPassword: boolean;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SimpleRegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PasswordResetRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  maritalStatus?: string;
}

export interface AddressInfo {
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AcademicInfo {
  institutionName: string;
  degree: string;
  passingYear: number;
  grade: string;
  gradeInPercentage: number;
}

export interface CtcInfo {
  amount: number;
  currency: string;
}

export interface WorkExperience {
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  companyName: string;
  designation: string;
  ctc?: CtcInfo;
  reasonForLeaving?: string;
}

export interface RegisterRequest {
  username: string;
  role: string;

  // ✅ NEW FIELDS (Added)
  governmentIdType: string;
  governmentIdNumber: string;

  personalDetails: PersonalDetails;
  address: AddressInfo;
  academicInfoList: AcademicInfo[];
  workExperienceList?: WorkExperience[];
}

export interface RegisterResponse {
  message: string;
  userId: number;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  profileCompletionPercentage: number;
}

export enum UserRole {
  ADMIN = "ADMIN",
  CAFE_OWNER = "CAFE_OWNER",
  CHEF = "CHEF",
  WAITER = "WAITER",
  CUSTOMER = "CUSTOMER",
}
