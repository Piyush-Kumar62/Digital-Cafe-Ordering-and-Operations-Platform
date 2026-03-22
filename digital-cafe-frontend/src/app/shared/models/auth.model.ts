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
  mustResetPassword?: boolean;
  registrationStatus?: string;
  cafeId?: number;
  avatarUrl?: string;
  profileImageUrl?: string;
  lastLogin?: string;
  createdAt?: string;

  // Staff specific fields
  joiningDate?: string;
  experienceYears?: number;
  shift?: string;
  govtIdType?: string;
  govtIdNumber?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  cafeId?: number;
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
  plotNumber: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AcademicInfo {
  institutionId?: number;
  institutionName: string;
  degree: string;
  branch?: string;
  passingYear: number;
  grade: string;
  gradeInPercentage: number;
  currentlyStudying?: boolean;
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
  govtIdType?: string;
  govtIdNumber?: string;
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
  ADMIN = "ROLE_ADMIN",
  CAFE_OWNER = "ROLE_CAFE_OWNER",
  CHEF = "ROLE_CHEF",
  WAITER = "ROLE_WAITER",
  CUSTOMER = "ROLE_CUSTOMER",
}
/**
 * Request body for café owner self-registration.
 * Sent as a JSON blob in a multipart/form-data request (part name "data").
 * An optional "logo" file part can accompany this.
 * NOTE: No password field — a secure temporary password is auto-generated
 * server-side and emailed to the owner. They must reset it on first login.
 */
export interface CafeOwnerRegisterRequest {
  // Owner personal info
  firstName: string;
  lastName: string;
  email: string;
  ownerPhoneNumber?: string; // personal mobile (optional)

  // Café details
  cafeName: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  phoneNumber: string; // café business phone

  // Operating hours (optional)
  openTime?: string;
  closeTime?: string;

  // Legal / compliance numbers (optional)
  fssaiNumber?: string;
  gstNumber?: string;
  msmeNumber?: string;
}
