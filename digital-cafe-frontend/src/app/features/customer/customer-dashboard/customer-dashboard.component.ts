import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { Subject, forkJoin } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { CartService } from "../cart/cart.service";
import { ApiService } from "@core/services/api.service";
import { Booking } from "@shared/models/booking.model";
import { Order } from "@shared/models/order.model";

@Component({
  selector: "app-customer-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./customer-dashboard.component.html",
  styleUrls: ["./customer-dashboard.component.scss"],
})
export class CustomerDashboardComponent implements OnInit, OnDestroy {
  cartItemCount = 0;
  loading = true;
  recentOrders: Order[] = [];
  upcomingBookings: Booking[] = [];
  stats = {
    activeOrders: 0,
    completedOrders: 0,
    activeBookings: 0,
  };
  private destroy$ = new Subject<void>();

  quickActions = [
    {
      path: "/customer/menu",
      title: "Browse Menu",
      description: "Explore dishes and add to cart",
      icon: "restaurant_menu",
    },
    {
      path: "/customer/booking",
      title: "Book a Table",
      description: "Reserve your slot in seconds",
      icon: "event_available",
    },
    {
      path: "/customer/cart",
      title: "My Cart",
      description: "Review items and place order",
      icon: "shopping_bag",
    },
    {
      path: "/customer/order-tracking",
      title: "Track Orders",
      description: "See live status updates",
      icon: "local_shipping",
    },
  ];

  constructor(
    private cartService: CartService,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.cartService.cart$
      .pipe(
        map((cart) => cart.totalItems),
        takeUntil(this.destroy$),
      )
      .subscribe((count) => (this.cartItemCount = count));

    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    forkJoin({
      bookings: this.apiService.getMyBookings(),
      orders: this.apiService.getMyOrders(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ bookings, orders }) => {
          const activeOrderStatuses = [
            "PENDING",
            "CONFIRMED",
            "PLACED",
            "PREPARING",
            "READY",
          ];
          const completedOrderStatuses = ["SERVED", "COMPLETED"];
          const activeBookingStatuses = ["PENDING", "CONFIRMED"];

          this.stats.activeOrders = orders.filter((o) =>
            activeOrderStatuses.includes(String(o.status)),
          ).length;
          this.stats.completedOrders = orders.filter((o) =>
            completedOrderStatuses.includes(String(o.status)),
          ).length;
          this.stats.activeBookings = bookings.filter((b) =>
            activeBookingStatuses.includes(String(b.status)),
          ).length;

          this.recentOrders = [...orders]
            .sort((a, b) => this.getTimestamp(b.createdAt) - this.getTimestamp(a.createdAt))
            .slice(0, 5);

          this.upcomingBookings = [...bookings]
            .filter((b) => activeBookingStatuses.includes(String(b.status)))
            .sort((a, b) => this.getBookingDateTime(a) - this.getBookingDateTime(b))
            .slice(0, 5);

          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case "READY":
      case "SERVED":
      case "COMPLETED":
      case "CONFIRMED":
        return "ok";
      case "PENDING":
      case "PLACED":
      case "PREPARING":
        return "warn";
      case "CANCELLED":
      case "NO_SHOW":
        return "bad";
      default:
        return "neutral";
    }
  }

  private getTimestamp(value?: string): number {
    if (!value) {
      return 0;
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private getBookingDateTime(booking: Booking): number {
    const date = booking.bookingDate || "";
    const time = booking.bookingTime || "00:00";
    const parsed = Date.parse(`${date}T${time}`);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  }
}
