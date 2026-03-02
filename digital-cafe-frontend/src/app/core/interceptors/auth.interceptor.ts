import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";
import { LoadingService } from "@core/services/loading.service";
import { finalize } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);

  loadingService.show();
  const token = authService.getToken();

  // These endpoints are unauthenticated — skip JWT injection to avoid CORS preflight rejection
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
    finalize(() => {
      loadingService.hide();
    }),
  );
};
