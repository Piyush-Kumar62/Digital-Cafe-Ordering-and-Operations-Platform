import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Cart } from '@shared/models/cart.model';
import { CartService } from './cart.service';
import { Router } from '@angular/router';
import { Booking } from '@shared/models/booking.model';
import { BookingService } from '../booking/booking.service';
import { CustomerJourneyService } from '../customer-journey.service';
import { AlertService } from '@core/services/alert.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart$: Observable<Cart> = this.cartService.cart$;
  specialInstructions: string = '';
  activeBooking: Booking | null = null;
  loadingBooking = false;
  private readonly fallbackImages: Record<string, string> = {
    APPETIZER: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=400&q=80',
    MAIN_COURSE: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=400&q=80',
    DESSERT: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80',
    BEVERAGE: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    SNACK: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
    DEFAULT: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=400&q=80',
  };

  constructor(
    private cartService: CartService,
    private router: Router,
    private bookingService: BookingService,
    private customerJourneyService: CustomerJourneyService,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {
    this.activeBooking = this.customerJourneyService.getActiveBooking();
    if (!this.activeBooking || (this.activeBooking.status !== 'BOOKED' && this.activeBooking.status !== 'CONFIRMED')) {
      this.loadLatestBooking();
    }
  }

  removeItem(itemId: number): void {
    this.cartService.removeItem(itemId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  placeOrder(): void {
    if (!this.activeBooking?.id) {
      this.alertService.error('Please complete table booking before placing order.');
      this.router.navigate(['/customer/cafe']);
      return;
    }

    const orderRequest = {
      bookingId: this.activeBooking.id,
      specialInstructions: this.specialInstructions
    };

    this.alertService.loading('Placing your order. Please wait.');
    this.cartService.placeOrder(orderRequest).subscribe({
      next: (order) => {
        this.alertService.close();
        this.cartService.clearCart();
        this.alertService.success('Order Placed', 'Complete payment to confirm your order.');
        this.router.navigate(['/customer/payment', order.id]);
      },
      error: (err) => {
        this.alertService.close();
        this.alertService.error('Order Failed', err?.error?.message || 'Failed to place order.');
      }
    });
  }

  goToBooking(): void {
    this.router.navigate(['/customer/cafe']);
  }

  getCartItemImage(item: any): string {
    if (item?.imageUrl && /^https?:\/\//i.test(item.imageUrl)) {
      return item.imageUrl;
    }
    const key = String(item?.category || '').toUpperCase();
    return this.fallbackImages[key] || this.fallbackImages['DEFAULT'];
  }

  onImageError(event: Event): void {
    const el = event.target as HTMLImageElement;
    if (!el) {
      return;
    }
    el.onerror = null;
    el.src = this.fallbackImages['DEFAULT'];
  }

  private loadLatestBooking(): void {
    this.loadingBooking = true;
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        const confirmed = (bookings || [])
          .filter((booking) => (booking.status === 'BOOKED' || booking.status === 'CONFIRMED') && !booking.hasOrder)
          .sort((a, b) =>
            new Date(`${b.bookingDate}T${b.bookingTime}`).getTime() -
            new Date(`${a.bookingDate}T${a.bookingTime}`).getTime(),
          );
        this.activeBooking = confirmed[0] || null;
        this.customerJourneyService.setActiveBooking(this.activeBooking);
        this.loadingBooking = false;
      },
      error: () => {
        this.activeBooking = null;
        this.loadingBooking = false;
      },
    });
  }
}


