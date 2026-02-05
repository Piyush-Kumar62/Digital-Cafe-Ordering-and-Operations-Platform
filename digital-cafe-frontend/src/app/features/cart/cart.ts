import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItem } from '../../shared/models/order.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  cartItems: CartItem[] = [];
  totalAmount = 0;
  orderType: 'DINE_IN' | 'TAKEAWAY' = 'DINE_IN';
  tableId?: number;
  specialInstructions = '';
  isProcessing = false;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.cartItems = this.orderService.getCartItems();
    this.calculateTotal();
  }

  calculateTotal() {
    this.totalAmount = this.cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
  }

  updateQuantity(item: CartItem, change: number) {
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }
    item.quantity = newQuantity;
    this.orderService.updateCartItem(item);
    this.calculateTotal();
  }

  removeItem(item: CartItem) {
    if (confirm(`Remove ${item.name} from cart?`)) {
      this.orderService.removeFromCart(item.menuItemId);
      this.loadCart();
    }
  }

  clearCart() {
    if (confirm('Clear all items from cart?')) {
      this.orderService.clearCart();
      this.loadCart();
    }
  }

  placeOrder() {
    if (!this.authService.isAuthenticated()) {
      alert('Please login to place an order');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (this.cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (this.orderType === 'DINE_IN' && !this.tableId) {
      alert('Please select a table number for dine-in orders');
      return;
    }

    this.isProcessing = true;

    const order = {
      customerId: this.orderService.getCurrentUserId(),
      cafeId: 1, // Default cafe ID
      orderType: this.orderType,
      tableId: this.orderType === 'DINE_IN' ? this.tableId : undefined,
      specialInstructions: this.specialInstructions,
      items: this.cartItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        specialInstructions: item.specialInstructions
      }))
    };

    this.orderService.createOrder(order).subscribe({
      next: (response) => {
        alert('Order placed successfully!');
        this.router.navigate(['/orders', response.id]);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
        this.isProcessing = false;
      }
    });
  }
}
