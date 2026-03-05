import { AsyncPipe, CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { CartService } from "@features/customer/cart/cart.service";
import { MenuItem } from "@shared/models/menu.model";
import { PaymentMethod } from "@shared/models/payment.model";
import { map, Observable, take } from "rxjs";
import { CafeBrowseService } from "../cafe-browse.service";
import {
  PublicCafeDetail,
  PublicCafeMenuItem,
} from "@shared/models/cafe.model";

@Component({
  selector: "app-cafe-detail",
  standalone: true,
  imports: [CommonModule, FormsModule, AsyncPipe],
  templateUrl: "./cafe-detail.component.html",
  styleUrl: "./cafe-detail.component.scss",
})
export class CafeDetailComponent implements OnInit {
  cafe: PublicCafeDetail | null = null;
  loading = true;
  bookingInProgress = false;
  orderInProgress = false;
  paymentInProgress = false;
  availableTables = 0;
  bookingId: number | null = null;
  orderId: number | null = null;
  selectedDate = "";
  selectedTime = "";
  guests = 2;
  paymentMethod: PaymentMethod = PaymentMethod.UPI;
  quantityMap: Record<number, number> = {};
  cartItems$: Observable<Array<{ item: MenuItem; quantity: number }>>;
  cartTotal$: Observable<number>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cafeBrowseService: CafeBrowseService,
    private cartService: CartService,
    private authService: AuthService,
    private alertService: AlertService,
  ) {
    this.cartItems$ = this.cartService.cart$.pipe(map((cart) => cart.items));
    this.cartTotal$ = this.cartService.cart$.pipe(
      map((cart) => cart.totalPrice),
    );
  }

  ngOnInit(): void {
    this.bootstrapDateTimeDefaults();
    const cafeId = Number(this.route.snapshot.paramMap.get("id"));
    if (!Number.isFinite(cafeId) || cafeId <= 0) {
      this.router.navigate(["/cafes"]);
      return;
    }

    this.cafeBrowseService.getCafeDetails(cafeId).subscribe({
      next: (res) => {
        this.cafe = res;
        this.loading = false;
        this.loadAvailability();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(["/cafes"]);
      },
    });
  }

  setQuantity(menuId: number, value: string): void {
    const numeric = Number(value);
    this.quantityMap[menuId] =
      Number.isFinite(numeric) && numeric > 0 ? Math.min(numeric, 10) : 1;
  }

  getQuantity(menuId: number): number {
    return this.quantityMap[menuId] || 1;
  }

  incrementQuantity(menuId: number): void {
    this.quantityMap[menuId] = Math.min(this.getQuantity(menuId) + 1, 10);
  }

  decrementQuantity(menuId: number): void {
    this.quantityMap[menuId] = Math.max(this.getQuantity(menuId) - 1, 1);
  }

  addToCart(item: PublicCafeMenuItem): void {
    if (!item.available || !this.cafe) {
      return;
    }
    const qty = this.getQuantity(item.id);
    const mapped: MenuItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      imageUrl: item.imageUrl,
      isAvailable: item.available,
      cafeId: this.cafe.cafeDetails.id,
      cafeName: this.cafe.cafeDetails.name,
    };
    for (let i = 0; i < qty; i += 1) {
      this.cartService.addItem(mapped);
    }
    this.alertService.success(`${item.name} added to cart`);
  }

  onSlotChange(): void {
    this.loadAvailability();
  }

  bookTable(): void {
    if (!this.cafe) {
      return;
    }
    if (!this.authService.isAuthenticated || !this.authService.isCustomer()) {
      this.router.navigate(["/auth/login"], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }
    this.bookingInProgress = true;
    this.cafeBrowseService
      .createBooking({
        cafeId: this.cafe.cafeDetails.id,
        date: this.selectedDate,
        timeSlot: this.selectedTime,
        numberOfGuests: this.guests,
      })
      .subscribe({
        next: (booking) => {
          this.bookingId = booking.id;
          this.bookingInProgress = false;
          this.alertService.success("Table booked successfully.");
        },
        error: (err) => {
          this.bookingInProgress = false;
          this.alertService.error(
            err?.error?.message || "Unable to book table.",
          );
        },
      });
  }

  placeOrder(): void {
    if (!this.bookingId) {
      this.alertService.error("Book a table first.");
      return;
    }
    this.orderInProgress = true;
    this.cartItems$
      .pipe(
        take(1),
        map((items) => items.filter((line) => line.quantity > 0)),
      )
      .subscribe({
        next: (lines) => {
          if (lines.length === 0) {
            this.orderInProgress = false;
            this.alertService.error("Cart is empty.");
            return;
          }
          this.cafeBrowseService
            .createOrder({
              bookingId: this.bookingId as number,
              items: lines.map((line) => ({
                menuId: line.item.id,
                quantity: line.quantity,
              })),
            })
            .subscribe({
              next: (order) => {
                this.orderInProgress = false;
                this.orderId = order.id;
                this.alertService.success("Order placed successfully.");
              },
              error: (err) => {
                this.orderInProgress = false;
                this.alertService.error(
                  err?.error?.message || "Unable to place order.",
                );
              },
            });
        },
        error: () => {
          this.orderInProgress = false;
        },
      });
  }

  payNow(): void {
    if (!this.orderId) {
      this.alertService.error("Place order before payment.");
      return;
    }
    this.paymentInProgress = true;
    this.cafeBrowseService
      .pay({
        orderId: this.orderId,
        paymentMethod: this.mapPaymentMethod(this.paymentMethod),
      })
      .subscribe({
        next: () => {
          this.paymentInProgress = false;
          this.cartService.clearCart();
          this.alertService.success("Payment successful.");
          this.router.navigate(["/customer/order-tracking", this.orderId]);
        },
        error: (err) => {
          this.paymentInProgress = false;
          this.alertService.error(err?.error?.message || "Payment failed.");
        },
      });
  }

  removeFromCart(menuId: number): void {
    this.cartService.removeItem(menuId);
  }

  private loadAvailability(): void {
    if (!this.cafe) {
      return;
    }
    // Normalize time to HH:mm (strip seconds if present)
    const timeSlot = this.selectedTime
      ? this.selectedTime.split(":").slice(0, 2).join(":")
      : "";
    if (!this.selectedDate || !timeSlot) return;
    this.cafeBrowseService
      .getTableAvailability(
        this.cafe.cafeDetails.id,
        this.selectedDate,
        timeSlot,
        this.guests,
      )
      .subscribe({
        next: (tables) => {
          this.availableTables = tables.length;
        },
        error: () => {
          this.availableTables = 0;
        },
      });
  }

  private bootstrapDateTimeDefaults(): void {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = new Date(now.getTime() + 60 * 60 * 1000);
    const hh = String(time.getHours()).padStart(2, "0");
    const mm = String(Math.floor(time.getMinutes() / 30) * 30).padStart(2, "0");
    this.selectedDate = date;
    this.selectedTime = `${hh}:${mm}`;
  }

  fmt12h(val: string | null | undefined): string {
    if (!val || !val.includes(":")) return "";
    const [hStr, mStr] = val.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return "";
    const ampm = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  private mapPaymentMethod(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CARD:
        return "CREDIT_CARD";
      case PaymentMethod.UPI:
        return "UPI";
      case PaymentMethod.WALLET:
        return "WALLET";
      case PaymentMethod.CASH:
      default:
        return "OTHER";
    }
  }
}
