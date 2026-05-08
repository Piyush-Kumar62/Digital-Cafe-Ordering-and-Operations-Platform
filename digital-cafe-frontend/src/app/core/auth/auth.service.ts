import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { environment } from "@environments/environment";
import {
  AuthResponse,
  CafeOwnerRegisterRequest,
  ChangePasswordRequest,
  LoginRequest,
  SimpleRegisterRequest,
  RegisterRequest,
  RegisterResponse,
  PasswordResetRequest,
  User,
  UserRole,
  MessageResponse,
} from "@shared/models/auth.model";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = `${environment.apiUrl}/auth`;
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem(environment.userKey);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null,
    );
    this.currentUser = this.currentUserSubject.asObservable();
    this.normalizeAuthState();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUserValue;
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

  public isSystemAdmin(): boolean {
    return this.isAdmin();
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
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/simple-register`, request)
      .pipe(
        tap((response) => this.handleAuthResponse(response)),
        catchError(this.handleError),
      );
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.apiUrl}/register`, request)
      .pipe(catchError(this.handleError));
  }

  // Govt ID proof is validated server-side; the file parameter is reserved for future upload flow
  registerWithGovtId(
    request: RegisterRequest,
    _govtIdProof: File,
  ): Observable<RegisterResponse> {
    return this.register(request);
  }

  /**
   * Café owner self-registration.
   * Sends a multipart/form-data request: JSON data blob + optional logo file.
   * POST /api/auth/register/cafe-owner
   */
  registerCafeOwner(
    request: CafeOwnerRegisterRequest,
    logo?: File,
    galleryImages: File[] = [],
  ): Observable<AuthResponse> {
    const formData = new FormData();
    const dataBlob = new Blob([JSON.stringify(request)], {
      type: "application/json",
    });
    formData.append("data", dataBlob);
    if (logo) {
      formData.append("logo", logo);
    }
    galleryImages.forEach((file) => {
      formData.append("galleryImages", file);
    });
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register/cafe-owner`, formData)
      .pipe(catchError(this.handleError));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, request, {
        withCredentials: true,
      })
      .pipe(
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
      .post<MessageResponse>(`${this.apiUrl}/resend-verification`, null, {
        params: { email },
      })
      .pipe(catchError(this.handleError));
  }

  checkUsernameAvailability(
    username: string,
  ): Observable<{ available: boolean }> {
    return this.http
      .get<{ available: boolean }>(`${this.apiUrl}/username-available`, {
        params: { username },
      })
      .pipe(catchError(this.handleError));
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.apiUrl}/forgot-password`, null, {
        params: { email },
      })
      .pipe(catchError(this.handleError));
  }

  resetPassword(
    token: string,
    request: PasswordResetRequest,
  ): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.apiUrl}/reset-password`, request, {
        params: { token },
      })
      .pipe(catchError(this.handleError));
  }

  changePassword(request: ChangePasswordRequest): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.apiUrl}/change-password`, request)
      .pipe(catchError(this.handleError));
  }

  getCurrentUser(): Observable<MessageResponse> {
    return this.http
      .get<MessageResponse>(`${this.apiUrl}/me`)
      .pipe(catchError(this.handleError));
  }

  logout(): void {
    // Notify backend to clear the HTTP-only refresh cookie
    this.http
      .post(`${this.apiUrl}/logout`, null, { withCredentials: true })
      .subscribe({
        next: () => this.clearClientState(),
        error: () => this.clearClientState(),
      });
  }

  private clearClientState(): void {
    this.accessToken = null;
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.userKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh-token`, null, {
        withCredentials: true,
      })
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.accessToken = response.token || null;

    const user: User = {
      id: response.userId,
      username: response.username,
      email: response.email,
      firstName: response.firstName ?? "",
      lastName: response.lastName ?? "",
      cafeId: response.cafeId,
      roles: response.roles,
      isEmailVerified: response.isEmailVerified,
      isProfileComplete: response.isProfileComplete,
      profileCompletionPercentage: response.profileCompletionPercentage,
      isActive: true,
    };

    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private normalizeAuthState(): void {
    this.accessToken = null;
    if (!this.currentUserSubject.value) {
      return;
    }
  }

  private clearStaleUser(): void {
    if (this.currentUserSubject.value) {
      localStorage.removeItem(environment.userKey);
      this.currentUserSubject.next(null);
    }
  }

  public updateUserData(user: User): void {
    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  public getRoleDashboardRoute(): string {
    const user = this.currentUserValue;
    if (!user || !user.roles || user.roles.length === 0) {
      return "/auth/login";
    }

    if (this.isAdmin()) {
      return "/admin/dashboard";
    } else if (this.isCafeOwner()) {
      // Directs Cafe Owners to login page logic; dashboard will handle redirect if no cafe exists
      return "/owner/dashboard";
    } else if (this.isChef()) {
      return "/chef/dashboard";
    } else if (this.isWaiter()) {
      return "/waiter/dashboard";
    } else if (this.isCustomer()) {
      return "/customer/dashboard";
    }

    return "/auth/login";
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = "An error occurred";

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const backendMessage = error.error?.message;
      const validationErrors = error.error?.errors;

      if (backendMessage) {
        errorMessage = backendMessage;
      } else if (validationErrors && typeof validationErrors === "object") {
        const first = Object.values(validationErrors).find(
          (value) => typeof value === "string" && value.trim().length > 0,
        ) as string | undefined;
        errorMessage = first || "Validation failed. Please check your inputs.";
      } else {
        errorMessage = error.message || errorMessage;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
