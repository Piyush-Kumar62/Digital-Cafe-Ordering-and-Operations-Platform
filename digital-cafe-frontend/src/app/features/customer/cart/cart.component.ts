import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Observable } from "rxjs";
import { Cart } from "@shared/models/cart.model";
import { CartService } from "./cart.service";
import { Router } from "@angular/router";
import { Booking } from "@shared/models/booking.model";
import { BookingService } from "../booking/booking.service";
import { CustomerJourneyService } from "../customer-journey.service";
import { AlertService } from "@core/services/alert.service";
import { CafeBrowseService } from "@features/public/cafe-browse.service";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./cart.component.html",
  styleUrls: ["./cart.component.scss"],
})
export class CartComponent implements OnInit {
  cart$: Observable<Cart> = this.cartService.cart$;
  specialInstructions: string = "";
  activeBooking: Booking | null = null;
  loadingBooking = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private bookingService: BookingService,
    private customerJourneyService: CustomerJourneyService,
    private alertService: AlertService,
    private cafeBrowseService: CafeBrowseService,
  ) {}

  ngOnInit(): void {
    this.activeBooking = this.customerJourneyService.getActiveBooking();
    if (
      !this.activeBooking ||
      (this.activeBooking.status !== "BOOKED" &&
        this.activeBooking.status !== "CONFIRMED")
    ) {
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
      this.alertService.error(
        "Please complete table booking before placing order.",
      );
      this.router.navigate(["/customer/cafe"]);
      return;
    }

    const orderRequest = {
      bookingId: this.activeBooking.id,
      specialInstructions: this.specialInstructions,
    };

    this.alertService.loading("Placing your order. Please wait.");
    this.cartService.placeOrder(orderRequest).subscribe({
      next: (order) => {
        this.alertService.close();
        this.cartService.clearCart();
        this.alertService.success(
          "Order Placed",
          "Complete payment to confirm your order.",
        );
        this.router.navigate(["/customer/payment", order.id]);
      },
      error: (err) => {
        this.alertService.close();
        this.alertService.error(
          "Order Failed",
          err?.error?.message || "Failed to place order.",
        );
      },
    });
  }

  goToBooking(): void {
    this.router.navigate(["/customer/cafe"]);
  }

  getCartItemImage(item: any): string {
    return this.cafeBrowseService.resolveImageUrl(item?.imageUrl) || "";
  }

  onImageError(event: Event): void {
    const el = event.target as HTMLImageElement;
    if (!el) return;
    el.onerror = null;
    el.style.display = "none";
  }

  private loadLatestBooking(): void {
    this.loadingBooking = true;
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        const confirmed = (bookings || [])
          .filter(
            (booking) =>
              (booking.status === "BOOKED" || booking.status === "CONFIRMED") &&
              !booking.hasOrder,
          )
          .sort(
            (a, b) =>
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
