import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  cafeId?: number;
}

export interface StaffCreationResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  tempPassword: string;
  active: boolean;
  emailVerified: boolean;
  profileCompleted: boolean;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  profileCompleted: boolean;
  tempPassword?: boolean;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Admin creates Café Owner account
   */
  createCafeOwner(request: CreateStaffRequest): Observable<StaffCreationResponse> {
    return this.http.post<StaffCreationResponse>(`${this.apiUrl}/create-cafe-owner`, request);
  }

  /**
   * Café Owner creates Chef account
   */
  createChef(request: CreateStaffRequest): Observable<StaffCreationResponse> {
    return this.http.post<StaffCreationResponse>(`${this.apiUrl}/create-chef`, request);
  }

  /**
   * Café Owner creates Waiter account
   */
  createWaiter(request: CreateStaffRequest): Observable<StaffCreationResponse> {
    return this.http.post<StaffCreationResponse>(`${this.apiUrl}/create-waiter`, request);
  }

  /**
   * Get all users
   */
  getAllUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(this.apiUrl);
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: string): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.apiUrl}/role/${role}`);
  }

  /**
   * Deactivate user
   */
  deactivateUser(id: number): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
