import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';

export const emailVerificationGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Only check authentication token
  const token = authService.getToken();

  if (!token) {
    router.navigate(['/auth/login']);
    return false;
  }

  // If token exists, allow access.
  // Backend will handle verification/approval securely.
  return true;
};