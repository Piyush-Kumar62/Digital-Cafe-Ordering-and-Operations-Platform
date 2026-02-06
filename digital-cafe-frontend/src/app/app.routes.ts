import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'menu',
    loadComponent: () => import('./features/menu/menu').then((m) => m.Menu),
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'auth/verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  // Dashboard Routes (Role-based)
  {
    path: 'dashboard/admin',
    loadComponent: () =>
      import('./features/dashboards/admin-dashboard/admin-dashboard').then(
        (m) => m.AdminDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'dashboard/owner',
    loadComponent: () =>
      import('./features/dashboards/owner-dashboard/owner-dashboard').then(
        (m) => m.OwnerDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CAFE_OWNER'] },
  },
  {
    path: 'dashboard/chef',
    loadComponent: () =>
      import('./features/dashboards/chef-dashboard/chef-dashboard').then(
        (m) => m.ChefDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CHEF'] },
  },
  {
    path: 'dashboard/waiter',
    loadComponent: () =>
      import('./features/dashboards/waiter-dashboard/waiter-dashboard').then(
        (m) => m.WaiterDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER'] },
  },
  {
    path: 'dashboard/customer',
    loadComponent: () =>
      import('./features/dashboards/customer-dashboard/customer-dashboard').then(
        (m) => m.CustomerDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER'] },
  },
  {
    path: 'create-staff',
    loadComponent: () =>
      import('./features/staff-management/create-staff/create-staff').then(
        (m) => m.CreateStaffComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CAFE_OWNER'] },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
