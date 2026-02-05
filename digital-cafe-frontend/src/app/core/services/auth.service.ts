import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserProfile } from '../../shared/models/user.model';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id?: number;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  message: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem('authToken');
    const userJson = localStorage.getItem('currentUser');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.logout();
      }
    }
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/auth/login', request).pipe(
      tap((response) => {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/api/auth/register', request).pipe(
      tap((response) => {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user ? user.emailVerified : false;
  }

  isProfileCompleted(): boolean {
    const user = this.getCurrentUser();
    return user ? user.profileCompleted : false;
  }

  verifyEmail(token: string): Observable<MessageResponse> {
    return this.apiService.get<MessageResponse>(`/api/auth/verify-email?token=${token}`);
  }

  resendVerificationEmail(email: string): Observable<MessageResponse> {
    return this.apiService.post<MessageResponse>(
      `/api/auth/resend-verification?email=${email}`,
      {},
    );
  }

  resetPassword(oldPassword: string, newPassword: string): Observable<MessageResponse> {
    return this.apiService.post<MessageResponse>('/api/auth/reset-password', {
      oldPassword,
      newPassword,
    });
  }

  getUserProfile(userId: number): Observable<UserProfile> {
    return this.apiService.get<UserProfile>(`/api/users/${userId}/profile`);
  }

  updateUserProfile(userId: number, profile: UserProfile): Observable<UserProfile> {
    return this.apiService.put<UserProfile>(`/api/users/${userId}/profile`, profile);
  }
}
