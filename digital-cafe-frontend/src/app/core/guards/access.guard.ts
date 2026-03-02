import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";
import { UserRole } from "@shared/models/auth.model";

// Single cascading guard: auth → role → email verification → profile completeness
export const accessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Unauthenticated users are redirected to login with the intended URL preserved
  if (!authService.isAuthenticated) {
    router.navigate(["/auth/login"], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  const user = authService.currentUserValue;
  if (!user) {
    router.navigate(["/auth/login"]);
    return false;
  }

  // Route data `roles` array specifies which roles are permitted
  const requiredRoles = route.data["roles"] as UserRole[];
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) =>
      authService.userRoles.includes(role)
    );
    if (!hasRequiredRole) {
      router.navigate([authService.getRoleDashboardRoute()]);
      return false;
    }
  }

  // Admins skip email and profile verification gates
  if (authService.isSystemAdmin()) {
    return true;
  }

  // Routes can opt out of email verification via route data `skipVerification: true`
  if (!route.data["skipVerification"] && !user.isEmailVerified) {
    if (!state.url.startsWith('/auth/verify-email')) {
      router.navigate(['/auth/verify-email']);
      return false;
    }
  }

  // Customers must complete their profile before accessing the app; skip via `skipProfileCheck: true`
  if (!route.data["skipProfileCheck"] && authService.isCustomer() && !user.isProfileComplete) {
    if (!state.url.startsWith('/customer/complete-profile')) {
      router.navigate(['/customer/complete-profile']);
      return false;
    }
  }

  return true;
};
