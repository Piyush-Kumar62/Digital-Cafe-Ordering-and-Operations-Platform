import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Profile {
  id?: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  bio?: string;
  profilePicture?: string;
  address?: Address;
  academicInfo?: AcademicInfo[];
  workExperience?: WorkExperience[];
  profileCompletionPercentage?: number;
}

export interface Address {
  street: string;
  plotNumber: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface AcademicInfo {
  id?: number;
  degree: string;
  institution: string;
  yearOfCompletion: number;
  percentage: number;
}

export interface WorkExperience {
  id?: number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profiles`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.apiUrl}/me`);
  }

  updateProfile(profile: Profile): Observable<Profile> {
    return this.http.put<Profile>(`${this.apiUrl}/me`, profile);
  }

  addAcademicInfo(academicInfo: AcademicInfo): Observable<AcademicInfo> {
    return this.http.post<AcademicInfo>(`${this.apiUrl}/me/academic-info`, academicInfo);
  }

  addWorkExperience(workExperience: WorkExperience): Observable<WorkExperience> {
    return this.http.post<WorkExperience>(`${this.apiUrl}/me/work-experience`, workExperience);
  }

  updateAddress(address: Address): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/me/address`, address);
  }

  getCompletionPercentage(): Observable<{ percentage: number }> {
    return this.http.get<{ percentage: number }>(`${this.apiUrl}/me/completion`);
  }
}
