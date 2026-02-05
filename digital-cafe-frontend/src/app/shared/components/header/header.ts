import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, AuthResponse } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  isScrolled = false;
  isMobileMenuOpen = false;
  isLoggedIn = false;
  currentUser: AuthResponse | null = null;
  cartItemCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private orderService: OrderService,
  ) {
    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });

    this.orderService.cartCount$.subscribe((count) => {
      this.cartItemCount = count;
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 100;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    document.body.classList.toggle('mobile-nav-active');
  }

  closeMobileMenu() {
    if (this.isMobileMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateToCart() {
    this.router.navigate(['/cart']);
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
