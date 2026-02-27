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
  {
    path: "cafes",
    loadComponent: () =>
      import("./features/public/cafe-list/cafe-list.component").then(
        (m) => m.CafeListComponent,
      ),
  },
  {
    path: "cafes/:id",
    loadComponent: () =>
      import("./features/public/cafe-detail/cafe-detail.component").then(
        (m) => m.CafeDetailComponent,
      ),
  },
  {
    path: "privacy",
    loadComponent: () =>
      import("./features/legal/privacy-policy.component").then(
        (m) => m.PrivacyPolicyComponent,
      ),
  },
  {
    path: "terms",
    loadComponent: () =>
      import("./features/legal/terms-conditions.component").then(
        (m) => m.TermsConditionsComponent,
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
      {
        path: "forgot-password",
        loadComponent: () =>
          import("./features/auth/forgot-password/forgot-password.component").then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: "reset-password",
        loadComponent: () =>
          import("./features/auth/reset-password/reset-password.component").then(
            (m) => m.ResetPasswordComponent,
          ),
      },
    ],
  },

  // Admin routes with layout
  {
    path: "admin",
    loadComponent: () =>
      import("./features/admin/admin-layout/admin-layout.component").then(
        (m) => m.AdminLayoutComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/admin/admin-dashboard/admin-dashboard.component").then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: "users",
        loadComponent: () =>
          import("./features/admin/users/user-management.component").then(
            (m) => m.UserManagementComponent,
          ),
      },
      {
        path: "cafes",
        loadComponent: () =>
          import("./features/admin/cafes/cafe-management.component").then(
            (m) => m.CafeManagementComponent,
          ),
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./features/admin/orders/order-management.component").then(
            (m) => m.OrderManagementComponent,
          ),
      },
      {
        path: "bookings",
        loadComponent: () =>
          import("./features/admin/bookings/booking-management.component").then(
            (m) => m.BookingManagementComponent,
          ),
      },
      {
        path: "analytics",
        loadComponent: () =>
          import("./features/admin/analytics/analytics.component").then(
            (m) => m.AnalyticsComponent,
          ),
      },
      {
        path: "reports",
        loadComponent: () =>
          import("./features/admin/reports/reports.component").then(
            (m) => m.ReportsComponent,
          ),
      },
      {
        path: "logs",
        loadComponent: () =>
          import("./features/admin/logs/logs.component").then(
            (m) => m.LogsComponent,
          ),
      },
      {
        path: "settings",
        loadComponent: () =>
          import("./features/admin/settings/settings.component").then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/admin/profile/admin-profile.component").then(
            (m) => m.AdminProfileComponent,
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
      {
        path: "menu",
        loadComponent: () =>
          import("./features/cafe-owner/owner-menu/owner-menu.component").then(
            (m) => m.OwnerMenuComponent,
          ),
      },
      {
        path: "tables",
        loadComponent: () =>
          import("./features/cafe-owner/owner-tables/owner-tables.component").then(
            (m) => m.OwnerTablesComponent,
          ),
      },
      {
        path: "staff",
        loadComponent: () =>
          import("./features/cafe-owner/owner-staff/owner-staff.component").then(
            (m) => m.OwnerStaffComponent,
          ),
      },
      {
        path: "bookings",
        loadComponent: () =>
          import("./features/cafe-owner/owner-bookings/owner-bookings.component").then(
            (m) => m.OwnerBookingsComponent,
          ),
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./features/cafe-owner/owner-orders/owner-orders.component").then(
            (m) => m.OwnerOrdersComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },
  {
    path: "owner",
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
      {
        path: "menu",
        loadComponent: () =>
          import("./features/cafe-owner/owner-menu/owner-menu.component").then(
            (m) => m.OwnerMenuComponent,
          ),
      },
      {
        path: "tables",
        loadComponent: () =>
          import("./features/cafe-owner/owner-tables/owner-tables.component").then(
            (m) => m.OwnerTablesComponent,
          ),
      },
      {
        path: "staff",
        loadComponent: () =>
          import("./features/cafe-owner/owner-staff/owner-staff.component").then(
            (m) => m.OwnerStaffComponent,
          ),
      },
      {
        path: "bookings",
        loadComponent: () =>
          import("./features/cafe-owner/owner-bookings/owner-bookings.component").then(
            (m) => m.OwnerBookingsComponent,
          ),
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./features/cafe-owner/owner-orders/owner-orders.component").then(
            (m) => m.OwnerOrdersComponent,
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
          import("./features/waiter/waiter-dashboard/waiter-dashboard.component").then(
            (m) => m.WaiterDashboardComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  {
    path: "customer/complete-profile",
    canActivate: [authGuard, emailVerificationGuard, roleGuard],
    data: { roles: [UserRole.CUSTOMER] },
    loadComponent: () =>
      import("./features/customer/complete-profile/complete-profile.component").then(
        (m) => m.CompleteProfileComponent,
      ),
  },
  // Customer routes
  {
    path: "customer",
    loadComponent: () =>
      import("./features/customer/customer-layout/customer-layout.component").then(
        (m) => m.CustomerLayoutComponent,
      ),
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
      {
        path: "cafe",
        loadComponent: () =>
          import("./features/customer/menu/menu.component").then(
            (m) => m.MenuComponent,
          ),
      },
      {
        path: "menu",
        redirectTo: "cafe",
        pathMatch: "full",
      },
      {
        path: "cart",
        loadComponent: () =>
          import("./features/customer/cart/cart.component").then(
            (m) => m.CartComponent,
          ),
      },
      {
        path: "payment/:orderId",
        loadComponent: () =>
          import("./features/customer/payment/payment.component").then(
            (m) => m.PaymentComponent,
          ),
      },
      {
        path: "booking",
        redirectTo: "cafe",
        pathMatch: "full",
      },
      {
        path: "order-tracking",
        loadComponent: () =>
          import("./features/customer/order-tracking/order-tracking.component").then(
            (m) => m.OrderTrackingComponent,
          ),
      },
      {
        path: "order-tracking/:id",
        loadComponent: () =>
          import("./features/customer/order-tracking/order-tracking.component").then(
            (m) => m.OrderTrackingComponent,
          ),
      },
      {
        path: "my-bookings",
        loadComponent: () =>
          import("./features/customer/my-bookings/my-bookings.component").then(
            (m) => m.MyBookingsComponent,
          ),
      },
      {
        path: "my-orders",
        loadComponent: () =>
          import("./features/customer/my-orders/my-orders.component").then(
            (m) => m.MyOrdersComponent,
          ),
      },
      {
        path: "payments",
        loadComponent: () =>
          import("./features/customer/my-payments/my-payments.component").then(
            (m) => m.MyPaymentsComponent,
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/customer/my-profile/my-profile.component").then(
            (m) => m.MyProfileComponent,
          ),
      },
      {
        path: "notifications",
        loadComponent: () =>
          import("./features/customer/my-notifications/my-notifications.component").then(
            (m) => m.MyNotificationsComponent,
          ),
      },
      { path: "", redirectTo: "cafe", pathMatch: "full" },
    ],
  },

  {
    path: "menu",
    canActivate: [
      authGuard,
      emailVerificationGuard,
      profileCompletionGuard,
      roleGuard,
    ],
    data: { roles: [UserRole.CUSTOMER] },
    loadComponent: () =>
      import("./features/customer/menu/menu.component").then(
        (m) => m.MenuComponent,
      ),
  },
  {
    path: "cart",
    canActivate: [
      authGuard,
      emailVerificationGuard,
      profileCompletionGuard,
      roleGuard,
    ],
    data: { roles: [UserRole.CUSTOMER] },
    loadComponent: () =>
      import("./features/customer/cart/cart.component").then(
        (m) => m.CartComponent,
      ),
  },
  {
    path: "checkout",
    canActivate: [
      authGuard,
      emailVerificationGuard,
      profileCompletionGuard,
      roleGuard,
    ],
    data: { roles: [UserRole.CUSTOMER] },
    loadComponent: () =>
      import("./features/customer/cart/cart.component").then(
        (m) => m.CartComponent,
      ),
  },
  {
    path: "booking",
    redirectTo: "/customer/cafe",
    pathMatch: "full",
  },
  {
    path: "orders",
    canActivate: [
      authGuard,
      emailVerificationGuard,
      profileCompletionGuard,
      roleGuard,
    ],
    data: { roles: [UserRole.CUSTOMER] },
    loadComponent: () =>
      import("./features/customer/my-orders/my-orders.component").then(
        (m) => m.MyOrdersComponent,
      ),
  },

  {
    path: "not-found",
    loadComponent: () =>
      import("./features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },

  // Fallback route
  { path: "**", redirectTo: "not-found" },
];
