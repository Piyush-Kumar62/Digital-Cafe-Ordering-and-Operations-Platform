import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { UserRole } from '@shared/models/auth.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.isAuthenticated) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Check if user has any of the required roles
  const userRoles = authService.userRoles;
  const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

  if (hasRequiredRole) {
    return true;
  }

  // User doesn't have required role - redirect to their dashboard
  const dashboardRoute = authService.getRoleDashboardRoute();
  router.navigate([dashboardRoute]);
  return false;
};
