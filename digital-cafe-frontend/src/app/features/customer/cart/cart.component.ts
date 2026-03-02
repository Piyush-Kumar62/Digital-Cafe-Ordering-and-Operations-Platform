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
    APPETIZER: 'assets/downloads/unsplash/cart-appetizer.jpg',
    MAIN_COURSE: 'assets/downloads/unsplash/cart-main-course.jpg',
    DESSERT: 'assets/downloads/unsplash/cart-dessert.jpg',
    BEVERAGE: 'assets/downloads/unsplash/cart-beverage.jpg',
    SNACK: 'assets/downloads/unsplash/cart-snack.jpg',
    DEFAULT: 'assets/downloads/unsplash/cart-default.jpg',
  };
  private readonly itemKeywordImages: Array<{ keywords: string[]; image: string }> = [
    { keywords: ['pizza'], image: 'assets/downloads/menu-items/pizza.jpg' },
    { keywords: ['burger'], image: 'assets/downloads/menu-items/burger.jpg' },
    { keywords: ['pasta', 'spaghetti', 'macaroni'], image: 'assets/downloads/menu-items/pasta.jpg' },
    { keywords: ['sandwich', 'sub', 'panini'], image: 'assets/downloads/menu-items/sandwich.jpg' },
    { keywords: ['fries', 'french fries', 'chips'], image: 'assets/downloads/menu-items/fries.jpg' },
    { keywords: ['salad'], image: 'assets/downloads/menu-items/salad.jpg' },
    { keywords: ['cake', 'pastry', 'brownie'], image: 'assets/downloads/menu-items/cake.jpg' },
    { keywords: ['ice cream', 'gelato', 'sundae'], image: 'assets/downloads/menu-items/ice-cream.jpg' },
    { keywords: ['coffee', 'espresso', 'latte', 'cappuccino', 'americano', 'mocha'], image: 'assets/downloads/menu-items/coffee.jpg' },
    { keywords: ['tea', 'chai', 'green tea'], image: 'assets/downloads/menu-items/tea.jpg' },
    { keywords: ['juice'], image: 'assets/downloads/menu-items/juice.jpg' },
    { keywords: ['smoothie', 'shake', 'milkshake'], image: 'assets/downloads/menu-items/smoothie.jpg' },
  ];

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
    if (item?.imageUrl && (/^https?:\/\//i.test(item.imageUrl) || item.imageUrl.startsWith('assets/'))) {
      return item.imageUrl;
    }
    const keywordImage = this.resolveImageByName(item?.name);
    if (keywordImage) {
      return keywordImage;
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

  private resolveImageByName(name?: string): string | null {
    const value = (name || '').toLowerCase();
    if (!value) return null;
    const match = this.itemKeywordImages.find((entry) => entry.keywords.some((key) => value.includes(key)));
    return match?.image ?? null;
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




