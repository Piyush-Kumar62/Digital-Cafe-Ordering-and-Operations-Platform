import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import {
  AuthResponse,
  LoginRequest,
  SimpleRegisterRequest,
  RegisterRequest,
  RegisterResponse,
  PasswordResetRequest,
  User,
  UserRole,
  MessageResponse,
} from '@shared/models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const storedUser = localStorage.getItem(environment.userKey);
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public get userRoles(): string[] {
    return this.currentUserValue?.roles || [];
  }

  public hasRole(role: UserRole): boolean {
    return this.userRoles.includes(role);
  }

  public isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  public isCafeOwner(): boolean {
    return this.hasRole(UserRole.CAFE_OWNER);
  }

  public isChef(): boolean {
    return this.hasRole(UserRole.CHEF);
  }

  public isWaiter(): boolean {
    return this.hasRole(UserRole.WAITER);
  }

  public isCustomer(): boolean {
    return this.hasRole(UserRole.CUSTOMER);
  }

  simpleRegister(request: SimpleRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/simple-register`, request).pipe(
      tap((response) => this.handleAuthResponse(response)),
      catchError(this.handleError),
    );
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, request).pipe(catchError(this.handleError));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => this.handleAuthResponse(response)),
      catchError(this.handleError),
    );
  }

  verifyEmail(token: string): Observable<MessageResponse> {
    return this.http
      .get<MessageResponse>(`${this.apiUrl}/verify-email`, {
        params: { token },
      })
      .pipe(catchError(this.handleError));
  }

  resendVerificationEmail(email: string): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.apiUrl}/resend-verification`, null, { params: { email } })
      .pipe(catchError(this.handleError));
  }

  resetPassword(request: PasswordResetRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/reset-password`, request).pipe(catchError(this.handleError));
  }

  getCurrentUser(): Observable<MessageResponse> {
    return this.http.get<MessageResponse>(`${this.apiUrl}/me`).pipe(catchError(this.handleError));
  }

  logout(): void {
    // Clear local storage
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem(environment.userKey);

    // Clear current user
    this.currentUserSubject.next(null);

    // Don't navigate here - let the caller decide where to go
  }

  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  private handleAuthResponse(response: AuthResponse): void {
    // Store tokens
    localStorage.setItem(environment.tokenKey, response.token);
    if (response.refreshToken) {
      localStorage.setItem(environment.refreshTokenKey, response.refreshToken);
    }

    // Create user object
    const user: User = {
      id: response.userId,
      username: response.username,
      email: response.email,
      firstName: '',
      lastName: '',
      roles: response.roles,
      isEmailVerified: response.isEmailVerified,
      isProfileComplete: response.isProfileComplete,
      profileCompletionPercentage: response.profileCompletionPercentage,
      isActive: true,
    };

    // Store user data
    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  public updateUserData(user: User): void {
    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  public getRoleDashboardRoute(): string {
    const user = this.currentUserValue;
    if (!user || !user.roles || user.roles.length === 0) {
      return '/auth/login';
    }

    // Check roles in priority order
    if (this.isAdmin()) {
      return '/admin/dashboard';
    } else if (this.isCafeOwner()) {
      return '/cafe-owner/dashboard';
    } else if (this.isChef()) {
      return '/chef/dashboard';
    } else if (this.isWaiter()) {
      return '/waiter/dashboard';
    } else if (this.isCustomer()) {
      return '/customer/dashboard';
    }

    return '/auth/login';
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || errorMessage;
    }

    console.error('Auth Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
