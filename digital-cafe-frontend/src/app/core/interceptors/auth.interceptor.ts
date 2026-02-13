import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";
import { LoadingService } from "@core/services/loading.service";
import { NotificationService } from "@core/services/notification.service";
import { catchError, finalize, throwError } from "rxjs";
import { Router } from "@angular/router";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  // Show loading indicator
  loadingService.show();

  // Get token
  const token = authService.getToken();

  // Define public endpoints that don't need authentication
  const publicEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/verify-email",
    "/auth/resend-verification",
    "/auth/reset-password",
    "/cafes/active",
    "/cafes/city",
  ];

  // Check if current request is to a public endpoint
  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    req.url.includes(endpoint),
  );

  // Clone request and add authorization header if token exists and not a public endpoint
  let authReq = req;
  if (token && !isPublicEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Handle request
  return next(authReq).pipe(
    catchError((error) => {
      // Hide loading
      loadingService.hide();

      // Handle different error statuses
      if (error.status === 401) {
        // Unauthorized - token expired or invalid
        // Only redirect to login if not already on a public page
        const currentUrl = router.url;
        const isPublicRoute =
          currentUrl === "/" || currentUrl.startsWith("/auth");

        if (!isPublicRoute) {
          notificationService.error(
            "Your session has expired. Please login again.",
          );
        }

        authService.logout();

        // Only navigate if not already on auth pages
        if (!currentUrl.startsWith("/auth")) {
          router.navigate(["/auth/login"]);
        }
      } else if (error.status === 403) {
        // Forbidden - insufficient permissions
        notificationService.error(
          "You do not have permission to access this resource.",
        );
      } else if (error.status === 404) {
        // Not found
        notificationService.error("The requested resource was not found.");
      } else if (error.status === 500) {
        // Server error
        notificationService.error(
          "A server error occurred. Please try again later.",
        );
      } else if (error.status === 0) {
        // Network error
        notificationService.error(
          "Network error. Please check your connection.",
        );
      } else {
        // Other errors
        const message =
          error.error?.message || error.message || "An error occurred";
        notificationService.error(message);
      }

      return throwError(() => error);
    }),
    finalize(() => {
      // Always hide loading when request completes
      loadingService.hide();
    }),
  );
};
