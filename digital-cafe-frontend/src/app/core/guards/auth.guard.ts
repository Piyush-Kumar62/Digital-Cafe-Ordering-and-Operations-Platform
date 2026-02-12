import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log("=== AUTH GUARD TRIGGERED ===");
  console.log("Requested URL:", state.url);
  console.log("Is authenticated:", authService.isAuthenticated);
  console.log("Current user:", authService.currentUserValue);
  console.log("Token exists:", !!authService.getToken());

  if (authService.isAuthenticated) {
    console.log("Auth guard passed");
    return true;
  }

  console.log("Auth guard failed, redirecting to login");
  // Store the attempted URL for redirecting after login
  router.navigate(["/auth/login"], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
