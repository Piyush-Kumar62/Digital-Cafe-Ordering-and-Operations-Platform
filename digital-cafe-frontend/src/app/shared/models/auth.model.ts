export interface User {
  id: number;
  username: string;
  email: string;

  firstName?: string;
  lastName?: string;

  roles: string[]; // e.g. ["ROLE_CHEF"]

  isEmailVerified: boolean;
  isProfileComplete: boolean;
  profileCompletionPercentage: number;

  isActive: boolean;
  mustResetPassword?: boolean;
  registrationStatus?: string;

  createdAt?: string;

  // ================= Cafe Mapping =================
  cafe?: Cafe;
  cafeId?: number;

  // ================= STAFF-ONLY FIELDS =================
  // These will exist only when role is CHEF / WAITER
  experienceYears?: number;
  shift?: "MORNING" | "EVENING" | "FULL_DAY";
  joiningDate?: string;

  govtIdType?: string;      // 🔥 ADD THIS
  govtIdNumber?: string;
}

export interface Cafe {
  id: number;
  name: string;
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
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

/* ================= PROFILE STRUCTURES ================= */

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus?: string;
}

export interface AddressInfo {
  street: string;
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

/* ================= ROLES ================= */

export enum UserRole {
  ADMIN = "ROLE_ADMIN",
  CAFE_OWNER = "ROLE_CAFE_OWNER",
  CHEF = "ROLE_CHEF",
  WAITER = "ROLE_WAITER",
  CUSTOMER = "ROLE_CUSTOMER",
}