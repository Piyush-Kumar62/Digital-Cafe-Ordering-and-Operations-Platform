export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'CAFE_OWNER' | 'CHEF' | 'WAITER' | 'CUSTOMER';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id?: number;
  userId: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  academicInfo?: AcademicInfo[];
  workExperience?: WorkExperience[];
}

export interface AcademicInfo {
  id?: number;
  degree: string;
  institution: string;
  yearOfPassing: number;
  percentage: number;
}

export interface WorkExperience {
  id?: number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}
