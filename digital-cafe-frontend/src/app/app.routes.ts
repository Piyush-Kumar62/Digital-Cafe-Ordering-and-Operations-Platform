import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.Home)
  },
  {
    path: 'menu',
    loadComponent: () => import('./features/menu/menu').then(m => m.Menu)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart').then(m => m.Cart)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
