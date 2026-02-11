import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";
import { roleGuard } from "./core/guards/role.guard";
import { emailVerificationGuard } from "./core/guards/email-verification.guard";
import { profileCompletionGuard } from "./core/guards/profile-completion.guard";
import { UserRole } from "./shared/models/auth.model";

export const routes: Routes = [
  // Landing page
  {
    path: "",
    loadComponent: () =>
      import("./features/landing/landing.component").then(
        (m) => m.LandingComponent,
      ),
  },

  // Public pages
  {
    path: "about",
    loadComponent: () =>
      import("./features/about/about.component").then((m) => m.AboutComponent),
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./features/contact/contact.component").then(
        (m) => m.ContactComponent,
      ),
  },

  // Authentication routes
  {
    path: "auth",
    children: [
      {
        path: "login",
        loadComponent: () =>
          import("./features/auth/login/login.component").then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: "register",
        loadComponent: () =>
          import("./features/auth/register/register.component").then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: "verify-email",
        loadComponent: () =>
          import("./features/auth/verify-email/verify-email.component").then(
            (m) => m.VerifyEmailComponent,
          ),
      },
    ],
  },

  // Admin routes
  {
    path: "admin",
    canActivate: [authGuard, emailVerificationGuard, roleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/admin/admin-dashboard/admin-dashboard.component").then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  // Café Owner routes
  {
    path: "cafe-owner",
    canActivate: [authGuard, emailVerificationGuard, roleGuard],
    data: { roles: [UserRole.CAFE_OWNER] },
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/cafe-owner/owner-dashboard/owner-dashboard.component").then(
            (m) => m.OwnerDashboardComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  // Chef routes
  {
    path: "chef",
    canActivate: [authGuard, emailVerificationGuard, roleGuard],
    data: { roles: [UserRole.CHEF] },
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/chef/chef-dashboard/chef-dashboard.component").then(
            (m) => m.ChefDashboardComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  // Waiter routes
  {
    path: "waiter",
    canActivate: [authGuard, emailVerificationGuard, roleGuard],
    data: { roles: [UserRole.WAITER] },
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/customer/customer-dashboard/customer-dashboard.component").then(
            (m) => m.CustomerDashboardComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  // Customer routes
  {
    path: "customer",
    canActivate: [
      authGuard,
      emailVerificationGuard,
      profileCompletionGuard,
      roleGuard,
    ],
    data: { roles: [UserRole.CUSTOMER] },
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/customer/customer-dashboard/customer-dashboard.component").then(
            (m) => m.CustomerDashboardComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  // Fallback route
  { path: "**", redirectTo: "" },
];
