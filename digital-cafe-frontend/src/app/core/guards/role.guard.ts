import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";
import { UserRole } from "@shared/models/auth.model";

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log("=== ROLE GUARD TRIGGERED ===");
  console.log("Requested URL:", state.url);

  // Check if user is authenticated
  if (!authService.isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    router.navigate(["/auth/login"]);
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data["roles"] as UserRole[];
  console.log("Required roles:", requiredRoles);

  if (!requiredRoles || requiredRoles.length === 0) {
    console.log("No required roles, allowing access");
    return true;
  }

  // Check if user has any of the required roles
  const userRoles = authService.userRoles;
  console.log("User roles:", userRoles);
  console.log("User roles type:", typeof userRoles);
  console.log(
    "Required roles type:",
    requiredRoles.map((r) => typeof r),
  );

  const hasRequiredRole = requiredRoles.some((role) => {
    const hasRole = userRoles.includes(role);
    console.log(`Checking role ${role}: ${hasRole}`);
    return hasRole;
  });

  console.log("Has required role:", hasRequiredRole);

  if (hasRequiredRole) {
    console.log("Role guard passed, allowing access");
    return true;
  }

  // User doesn't have required role - redirect to their dashboard
  console.log("Role guard failed, redirecting to user dashboard");
  const dashboardRoute = authService.getRoleDashboardRoute();
  console.log("Redirect to:", dashboardRoute);
  router.navigate([dashboardRoute]);
  return false;
};
