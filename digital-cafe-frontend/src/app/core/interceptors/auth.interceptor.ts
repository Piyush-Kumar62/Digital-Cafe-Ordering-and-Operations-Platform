import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";
import { LoadingService } from "@core/services/loading.service";
import { catchError, filter, finalize, Observable, switchMap, take, throwError } from "rxjs";
import { BehaviorSubject } from "rxjs";
import { Router } from "@angular/router";
import { HttpEvent } from "@angular/common/http";

// Shared state for the functional interceptor
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);
  const router = inject(Router);

  const skipLoading = req.headers.has("x-silent-loading");
  if (!skipLoading) {
    loadingService.show();
  }
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
  
  // Attach credentials (cookies) to all requests crossing the interceptor
  authReq = authReq.clone({
    withCredentials: true
  });

  if (token && !isPublicEndpoint) {
    authReq = authReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't intercept auth endpoints to prevent loops
      if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh-token')) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        return handle401Error(authReq, next, authService, router);
      }
      
      return throwError(() => error);
    }),
    finalize(() => {
      if (!skipLoading) {
        loadingService.hide();
      }
    }),
  );
};

function handle401Error(request: any, next: any, authService: AuthService, router: Router): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        // The service automatically stores the new access token
        refreshTokenSubject.next(response.token);
        return next(
          request.clone({
            setHeaders: {
              Authorization: `Bearer ${response.token}`,
            },
          })
        ) as Observable<HttpEvent<any>>;
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => err);
      })
    );
  } else {
    // Wait until refresh is complete, then retry the request
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next(
          request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          })
        ) as Observable<HttpEvent<any>>;
      })
    );
  }
}
