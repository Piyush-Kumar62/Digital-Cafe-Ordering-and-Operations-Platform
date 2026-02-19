import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../cart/cart.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss']
})
export class CustomerDashboardComponent {
  cartItemCount$: Observable<number>;

  navLinks = [
    { path: 'menu', label: 'Menu', icon: 'restaurant_menu' },
    { path: 'booking', label: 'Book a Table', icon: 'event' },
    { path: 'cart', label: 'My Cart', icon: 'shopping_cart' },
    // A link to a theoretical "my orders" list page could go here
    // { path: 'orders', label: 'My Orders', icon: 'receipt_long' }
  ];

  constructor(private cartService: CartService) {
    this.cartItemCount$ = this.cartService.cart$.pipe(
      map(cart => cart.totalItems)
    );
  }
}