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

  loadingService.show();
  const token = authService.getToken();

  const publicEndpoints = [
    "/auth/login",
    "/auth/register",
    "/auth/verify-email",
    "/auth/resend-verification",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/cafes/active",
    "/cafes/city",
  ];

  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    req.url.includes(endpoint),
  );

  let authReq = req;
  if (token && !isPublicEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      loadingService.hide();

      if (error.status === 401) {
        const currentUrl = router.url;
        const isPublicRoute =
          currentUrl === "/" || currentUrl.startsWith("/auth");

        if (!isPublicRoute) {
          notificationService.error(
            "Your session has expired. Please login again.",
          );
        }

        authService.logout();

        if (!currentUrl.startsWith("/auth")) {
          router.navigate(["/auth/login"]);
        }
      } else if (error.status === 403) {
        notificationService.error(
          "You do not have permission to access this resource.",
        );
      } else if (error.status === 404) {
        notificationService.error("The requested resource was not found.");
      } else if (error.status === 500) {
        notificationService.error(
          "A server error occurred. Please try again later.",
        );
      } else if (error.status === 0) {
        notificationService.error(
          "Network error. Please check your connection.",
        );
      } else {
        const message =
          error.error?.message || error.message || "An error occurred";
        notificationService.error(message);
      }

      return throwError(() => error);
    }),
    finalize(() => {
      loadingService.hide();
    }),
  );
};
