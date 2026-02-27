export interface Profile {
  id: number;
  userId: number;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  address?: Address;
  academicInfo?: AcademicInfo[];
  workExperience?: WorkExperience[];
  profileCompletionPercentage: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface AcademicInfo {
  id: number;
  institutionName: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  grade?: string;
  isCurrentlyStudying: boolean;
}

export interface WorkExperience {
  id: number;
  companyName: string;
  position: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrentlyWorking: boolean;
}

export interface ProfileUpdateRequest {
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  address?: Address;
}
