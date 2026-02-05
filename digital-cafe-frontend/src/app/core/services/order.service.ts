import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Order, OrderItem, CartItem, Booking, Payment } from '../../shared/models/order.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.loadCartFromStorage();
  }

  private loadCartFromStorage(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        this.cartItems = JSON.parse(savedCart);
        this.cartSubject.next(this.cartItems);
        this.updateCartCount();
      } catch (error) {
        console.error('Error loading cart:', error);
        this.clearCart();
      }
    }
  }

  private saveCartToStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
    this.cartSubject.next(this.cartItems);
    this.updateCartCount();
  }

  private updateCartCount(): void {
    const count = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    this.cartCountSubject.next(count);
  }

  // Cart Management
  addToCart(item: CartItem): void {
    const existingItem = this.cartItems.find(i => i.menuItemId === item.menuItemId);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cartItems.push(item);
    }

    this.saveCartToStorage();
  }

  removeFromCart(menuItemId: number): void {
    this.cartItems = this.cartItems.filter(item => item.menuItemId !== menuItemId);
    this.saveCartToStorage();
  }

  updateCartItem(item: CartItem): void {
    const index = this.cartItems.findIndex(i => i.menuItemId === item.menuItemId);
    if (index !== -1) {
      this.cartItems[index] = item;
      this.saveCartToStorage();
    }
  }

  updateQuantity(menuItemId: number, quantity: number): void {
    const item = this.cartItems.find(i => i.menuItemId === menuItemId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(menuItemId);
      } else {
        item.quantity = quantity;
        this.saveCartToStorage();
      }
    }
  }

  getCartItems(): CartItem[] {
    return [...this.cartItems];
  }

  getCartTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  clearCart(): void {
    this.cartItems = [];
    localStorage.removeItem('cart');
    this.cartSubject.next(this.cartItems);
    this.updateCartCount();
  }

  // Order API calls
  createOrder(order: any): Observable<Order> {
    return this.apiService.post<Order>('/api/orders', order).pipe(
      tap(() => this.clearCart())
    );
  }

  getAllOrders(): Observable<Order[]> {
    return this.apiService.get<Order[]>('/api/orders');
  }

  getOrderById(orderId: number): Observable<Order> {
    return this.apiService.get<Order>(`/api/orders/${orderId}`);
  }

  getCustomerOrders(customerId: number): Observable<Order[]> {
    return this.apiService.get<Order[]>(`/api/orders/customer/${customerId}`);
  }

  getCafeOrders(cafeId: number): Observable<Order[]> {
    return this.apiService.get<Order[]>(`/api/orders/cafe/${cafeId}`);
  }

  getOrdersByStatus(status: string): Observable<Order[]> {
    return this.apiService.get<Order[]>(`/api/orders/status/${status}`);
  }

  updateOrder(orderId: number, order: Order): Observable<Order> {
    return this.apiService.put<Order>(`/api/orders/${orderId}`, order);
  }

  updateOrderStatus(orderId: number, status: string): Observable<Order> {
    return this.apiService.patch<Order>(`/api/orders/${orderId}/status`, { status });
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.updateOrderStatus(orderId, 'CANCELLED');
  }

  deleteOrder(orderId: number): Observable<void> {
    return this.apiService.delete<void>(`/api/orders/${orderId}`);
  }

  // Booking API calls
  createBooking(booking: Booking): Observable<Booking> {
    return this.apiService.post<Booking>('/api/bookings', booking);
  }

  getBookingById(bookingId: number): Observable<Booking> {
    return this.apiService.get<Booking>(`/api/bookings/${bookingId}`);
  }

  getCustomerBookings(customerId: number): Observable<Booking[]> {
    return this.apiService.get<Booking[]>(`/api/bookings/customer/${customerId}`);
  }

  getCafeBookings(cafeId: number, date?: string): Observable<Booking[]> {
    const endpoint = date
      ? `/api/bookings/cafe/${cafeId}?date=${date}`
      : `/api/bookings/cafe/${cafeId}`;
    return this.apiService.get<Booking[]>(endpoint);
  }

  updateBookingStatus(bookingId: number, status: string): Observable<Booking> {
    return this.apiService.patch<Booking>(`/api/bookings/${bookingId}/status`, { status });
  }

  cancelBooking(bookingId: number): Observable<Booking> {
    return this.updateBookingStatus(bookingId, 'CANCELLED');
  }

  // Payment API calls
  createPayment(payment: Payment): Observable<Payment> {
    return this.apiService.post<Payment>('/api/payments', payment);
  }

  getPaymentByOrderId(orderId: number): Observable<Payment> {
    return this.apiService.get<Payment>(`/api/payments/order/${orderId}`);
  }

  updatePaymentStatus(paymentId: number, status: string): Observable<Payment> {
    return this.apiService.patch<Payment>(`/api/payments/${paymentId}/status`, { status });
  }

  getCurrentUserId(): number {
    const user = this.authService.getCurrentUser();
    return user?.id || 0;
  }
}
