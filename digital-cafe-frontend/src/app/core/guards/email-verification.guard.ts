import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';

export const emailVerificationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserValue;

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    router.navigate(['/auth/verify-email']);
    return false;
  }

  return true;
};
