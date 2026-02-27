import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';

export const profileCompletionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserValue;

  if (state.url.startsWith('/customer/complete-profile')) {
    return true;
  }

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (authService.isSystemAdmin()) {
    return true;
  }

  // Check if profile is complete (only for customers)
  if (authService.isCustomer() && !user.isProfileComplete) {
    router.navigate(['/customer/complete-profile']);
    return false;
  }

  return true;
};

