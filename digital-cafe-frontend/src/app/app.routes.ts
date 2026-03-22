import { Routes } from "@angular/router";
import { accessGuard } from "./core/guards/access.guard";
import { UserRole } from "./shared/models/auth.model";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/landing/landing.component").then(
        (m) => m.LandingComponent,
      ),
  },

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
        path: "register/customer",
        loadComponent: () =>
          import("./features/auth/register/register.component").then(
            (m) => m.RegisterComponent,
          ),
        data: { role: "CUSTOMER" },
      },
      {
        path: "register/cafe-owner",
        loadComponent: () =>
          import("./features/auth/register/register.component").then(
            (m) => m.RegisterComponent,
          ),
        data: { role: "CAFE_OWNER" },
      },
      {
        path: "register",
        loadComponent: () =>
          import("./features/auth/register-role/register-role.component").then(
            (m) => m.RegisterRoleComponent,
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

  {
    path: "admin",
    loadComponent: () =>
      import("./features/admin/admin-layout/admin-layout.component").then(
        (m) => m.AdminLayoutComponent,
      ),
    canActivate: [accessGuard],
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
        path: "education",
        loadComponent: () =>
          import("./features/admin/education/education-management.component").then(
            (m) => m.EducationManagementComponent,
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/admin/profile/admin-profile.component").then(
            (m) => m.AdminProfileComponent,
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
        path: "logs",
        loadComponent: () =>
          import("./features/admin/logs/logs.component").then(
            (m) => m.LogsComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },
  {
    path: "owner",
    loadComponent: () =>
      import("./features/cafe-owner/owner-layout/owner-layout.component").then(
        (m) => m.OwnerLayoutComponent,
      ),
    canActivate: [accessGuard],
    data: { roles: [UserRole.CAFE_OWNER] },
    children: [
      {
        path: "setup",
        loadComponent: () =>
          import("./features/cafe-owner/setup-cafe/setup-cafe.component").then(
            (m) => m.SetupCafeComponent,
          ),
      },
      {
        path: "cafes",
        loadComponent: () =>
          import("./features/cafe-owner/owner-cafes/owner-cafes.component").then(
            (m) => m.OwnerCafesComponent,
          ),
      },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/cafe-owner/owner-dashboard/owner-dashboard.component").then(
            (m) => m.CafeOwnerDashboardComponent,
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
        path: "orders",
        loadComponent: () =>
          import("./features/cafe-owner/owner-orders/owner-orders.component").then(
            (m) => m.OwnerOrdersComponent,
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
        path: "settings",
        loadComponent: () =>
          import("./features/cafe-owner/owner-settings/owner-settings.component").then(
            (m) => m.OwnerSettingsComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },
  {
    path: "chef",
    loadComponent: () =>
      import("./features/chef/chef-layout/chef-layout.component").then(
        (m) => m.ChefLayoutComponent,
      ),
    canActivate: [accessGuard],
    data: { roles: [UserRole.CHEF] },
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/chef/chef-dashboard/chef-dashboard.component").then(
            (m) => m.ChefDashboardComponent,
          ),
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./features/chef/chef-orders/chef-orders.component").then(
            (m) => m.ChefOrdersComponent,
          ),
      },
      {
        path: "order-history",
        loadComponent: () =>
          import("./features/chef/chef-order-history/chef-order-history.component").then(
            (m) => m.ChefOrderHistoryComponent,
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/chef/chef-profile/chef-profile.component").then(
            (m) => m.ChefProfileComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  {
    path: "waiter",
    loadComponent: () =>
      import("./features/waiter/waiter-layout/waiter-layout.component").then(
        (m) => m.WaiterLayoutComponent,
      ),
    canActivate: [accessGuard],
    data: { roles: [UserRole.WAITER] },
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/waiter/waiter-dashboard/waiter-dashboard.component").then(
            (m) => m.WaiterDashboardComponent,
          ),
      },
      {
        path: "profile",
        loadComponent: () =>
          import("./features/waiter/waiter-profile/waiter-profile.component").then(
            (m) => m.WaiterProfileComponent,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  {
    path: "customer/complete-profile",
    canActivate: [accessGuard],
    data: { roles: [UserRole.CUSTOMER], skipProfileCheck: true },
    loadComponent: () =>
      import("./features/customer/complete-profile/complete-profile.component").then(
        (m) => m.CompleteProfileComponent,
      ),
  },
  {
    path: "customer",
    loadComponent: () =>
      import("./features/customer/customer-layout/customer-layout.component").then(
        (m) => m.CustomerLayoutComponent,
      ),
    canActivate: [accessGuard],
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
        path: "menu",
        loadComponent: () =>
          import("./features/customer/menu/menu.component").then(
            (m) => m.MenuComponent,
          ),
      },
      {
        path: "cart",
        loadComponent: () =>
          import("./features/customer/cart/cart.component").then(
            (m) => m.CartComponent,
          ),
      },
      {
        path: "booking",
        loadComponent: () =>
          import("./features/customer/booking/booking.component").then(
            (m) => m.BookingComponent,
          ),
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
        path: "payment/:orderId",
        loadComponent: () =>
          import("./features/customer/payment/payment.component").then(
            (m) => m.PaymentComponent,
          ),
      },
      {
        path: "browse-cafes",
        loadComponent: () =>
          import("./features/customer/browse-cafes/browse-cafes.component").then(
            (m) => m.BrowseCafesComponent,
          ),
      },
      {
        path: "browse-cafes/:id",
        loadComponent: () =>
          import("./features/public/cafe-detail/cafe-detail.component").then(
            (m) => m.CafeDetailComponent,
          ),
      },
      {
        path: "cafe",
        redirectTo: "browse-cafes",
        pathMatch: "full",
      },
      {
        path: "my-orders",
        redirectTo: "order-tracking",
        pathMatch: "full",
      },
      {
        path: "my-bookings",
        loadComponent: () =>
          import("./features/customer/my-bookings/my-bookings.component").then(
            (m) => m.MyBookingsComponent,
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
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },

  {
    path: "menu",
    canActivate: [accessGuard],
    data: { roles: [UserRole.CUSTOMER] },
    loadComponent: () =>
      import("./features/customer/menu/menu.component").then(
        (m) => m.MenuComponent,
      ),
  },

  // ─── Public cafe browsing (accessible to everyone, auth not required) ───
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
    path: "not-found",
    loadComponent: () =>
      import("./features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },

  { path: "**", redirectTo: "not-found" },
];
