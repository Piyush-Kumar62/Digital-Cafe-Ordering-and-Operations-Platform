import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { AlertService } from '@core/services/alert.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const alertService = inject(AlertService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const currentUrl = router.url || '/';
      const isAuthRoute = currentUrl.startsWith('/auth');

      switch (error.status) {
        case 400: {
          const message = error.error?.message || 'Please check your input and try again.';
          alertService.warning('Validation Error', message);
          break;
        }
        case 401: {
          if (!isAuthRoute) {
            alertService.error('Session Expired', 'Your session has expired. Please login again.');
          }
          authService.logout();
          if (!isAuthRoute) {
            void router.navigate(['/auth/login']);
          }
          break;
        }
        case 403: {
          alertService.error('Access Denied', 'You do not have permission to access this resource.');
          break;
        }
        case 404: {
          alertService.info('Not Found', 'The requested resource was not found.');
          break;
        }
        case 500: {
          alertService.error('Server Error', 'A server error occurred. Please try again later.');
          break;
        }
        case 0: {
          alertService.error('Network Error', 'Please check your internet connection.');
          break;
        }
        default: {
          const message = error.error?.message || error.message || 'An unexpected error occurred.';
          alertService.error('Request Failed', message);
          break;
        }
      }

      return throwError(() => error);
    }),
  );
};
