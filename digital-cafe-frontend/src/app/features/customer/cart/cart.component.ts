import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Cart } from '@shared/models/cart.model';
import { CartService } from './cart.service';
import { OrderType } from '@shared/models/order.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent {
  cart$: Observable<Cart> = this.cartService.cart$;
  specialInstructions: string = '';

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  removeItem(itemId: number): void {
    this.cartService.removeItem(itemId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  placeOrder(): void {
    // Hardcoded values for demonstration. In a real app, these would be dynamic.
    const orderRequest = {
      cafeId: 1,
      tableId: 1, // This should come from a booking or table selection feature
      orderType: OrderType.DINE_IN,
      specialInstructions: this.specialInstructions
    };

    this.cartService.placeOrder(orderRequest).subscribe({
      next: (order) => {
        console.log('Order placed successfully', order);
        this.cartService.clearCart();
        // Navigate to the order tracking page for the new order
        this.router.navigate(['/customer/orders', order.id]);
      },
      error: (err) => {
        console.error('Failed to place order', err);
        // Handle error, e.g., show a notification
      }
    });
  }
}
