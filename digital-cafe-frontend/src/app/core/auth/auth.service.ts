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
    return !!this.getToken() && !!this.currentUserValue;
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
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request, { withCredentials: true }).pipe(
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
    this.http.post(`${this.apiUrl}/logout`, null, { withCredentials: true }).subscribe({
      next: () => this.clearClientState(),
      error: () => this.clearClientState()
    });
  }

  private clearClientState(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.userKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    const token = localStorage.getItem(environment.tokenKey);
    if (!token) {
      this.clearStaleUser();
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.logout();
      return null;
    }

    return token;
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, null, { withCredentials: true }).pipe(
      tap((response) => this.handleAuthResponse(response))
    );
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(environment.tokenKey, response.token);
    

    const user: User = {
      id: response.userId,
      username: response.username,
      email: response.email,
      firstName: response.firstName ?? "",
      lastName: response.lastName ?? "",
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
    const token = localStorage.getItem(environment.tokenKey);
    if (!token) {
      this.clearStaleUser();
      return;
    }

    if (this.isTokenExpired(token)) {
      this.logout();
      return;
    }

    // Token exists but no cached user — clear token to avoid auth drift
    if (!this.currentUserSubject.value) {
      this.logout();
    }
  }

  private clearStaleUser(): void {
    if (this.currentUserSubject.value) {
      localStorage.removeItem(environment.userKey);
      this.currentUserSubject.next(null);
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split(".")[1];
      if (!payload) return false;
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join(""),
      );
      const data = JSON.parse(json) as { exp?: number };
      if (!data?.exp) return false;
      const nowSeconds = Math.floor(Date.now() / 1000);
      return data.exp <= nowSeconds;
    } catch {
      return false;
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
