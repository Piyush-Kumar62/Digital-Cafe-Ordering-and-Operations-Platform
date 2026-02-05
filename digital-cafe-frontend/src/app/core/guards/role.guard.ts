import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles = route.data['roles'] as string[];

  return authService.currentUser$.pipe(
    map(user => {
      if (!user) {
        router.navigate(['/auth/login']);
        return false;
      }

      if (expectedRoles && !expectedRoles.includes(user.role)) {
        router.navigate(['/unauthorized']);
        return false;
      }

      return true;
    })
  );
};
