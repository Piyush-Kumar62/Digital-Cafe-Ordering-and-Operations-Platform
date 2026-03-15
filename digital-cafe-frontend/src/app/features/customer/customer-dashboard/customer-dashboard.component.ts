import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { Subject, forkJoin } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { ApiService } from "@core/services/api.service";
import { Booking, BookingStatus } from "@shared/models/booking.model";
import { Order, OrderStatus } from "@shared/models/order.model";
import { CardComponent } from "@shared/components/card/card";
import { ChartComponent } from "@shared/components/chart/chart";
import { AuthService } from "@core/auth/auth.service";
import { User } from "@shared/models/auth.model";

@Component({
  selector: "app-customer-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, ChartComponent],
  templateUrl: "./customer-dashboard.component.html",
  styleUrls: ["./customer-dashboard.component.scss"],
})
export class CustomerDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  summaryStats: {
    title: string;
    value: string;
    icon: string;
    description: string;
    variant: "blue" | "teal" | "violet" | "orange" | "rose" | "indigo";
  }[] = [];
  recentOrders: Order[] = [];
  upcomingBookings: Booking[] = [];
  user: User | null = null;

  monthlyBookingTrend: any[] = [];
  orderStatusDistribution: any[] = [];
  monthlySpending: any[] = [];
  currentDateTime = new Date();

  private destroy$ = new Subject<void>();
  private clockTimerId?: ReturnType<typeof setInterval>;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => (this.user = user));
    this.startClock();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.clockTimerId) {
      clearInterval(this.clockTimerId);
      this.clockTimerId = undefined;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startClock(): void {
    this.currentDateTime = new Date();
    this.clockTimerId = setInterval(() => {
      this.currentDateTime = new Date();
    }, 1000);
  }

  private loadDashboardData(): void {
    forkJoin({
      bookings: this.apiService.getMyBookings(),
      orders: this.apiService.getMyOrders(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ bookings, orders }) => {
          this.calculateSummaryStats(bookings, orders);
          this.prepareRecentActivities(bookings, orders);
          this.prepareCharts(bookings, orders);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private calculateSummaryStats(bookings: Booking[], orders: Order[]): void {
    const totalBookings = bookings.length;
    const upcomingBookingsCount = bookings.filter(
      (b) => b.status === BookingStatus.CONFIRMED,
    ).length;
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (o) => o.status === OrderStatus.SERVED,
    ).length;
    const totalAmountSpent = orders.reduce(
      (acc, o) => acc + Number(o.totalAmount || 0),
      0,
    );
    const activeNotifications = Number(
      localStorage.getItem("customer_unread_notifications") || "0",
    );

    this.summaryStats = [
      {
        title: "Total Bookings",
        value: totalBookings.toString(),
        icon: "book_online",
        description: "All time",
        variant: "blue",
      },
      {
        title: "Upcoming Booking",
        value: upcomingBookingsCount.toString(),
        icon: "event",
        description: "Confirmed bookings",
        variant: "teal",
      },
      {
        title: "Total Orders",
        value: totalOrders.toString(),
        icon: "receipt_long",
        description: "All time",
        variant: "violet",
      },
      {
        title: "Completed Orders",
        value: completedOrders.toString(),
        icon: "done_all",
        description: "Served & paid",
        variant: "indigo",
      },
      {
        title: "Total Spent",
        value: this.formatInrCurrency(totalAmountSpent),
        icon: "currency_rupee",
        description: "Across all orders",
        variant: "orange",
      },
      {
        title: "Active Notifications",
        value: activeNotifications.toString(),
        icon: "notifications",
        description: "Unread messages",
        variant: "rose",
      },
    ];
  }

  private prepareRecentActivities(bookings: Booking[], orders: Order[]): void {
    this.recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
      )
      .slice(0, 5);

    this.upcomingBookings = [...bookings]
      .filter((b) => b.status === BookingStatus.CONFIRMED)
      .sort(
        (a, b) =>
          new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime(),
      )
      .slice(0, 5);
  }

  private prepareCharts(bookings: Booking[], orders: Order[]): void {
    const monthLabels = this.getLastSixMonths();

    const bookingCountsByMonth = bookings.reduce(
      (acc, b) => {
        const date = new Date(b.bookingDate);
        if (Number.isNaN(date.getTime())) return acc;
        const month = date.toLocaleString("default", { month: "short" });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    this.monthlyBookingTrend = [
      {
        name: "Bookings",
        series: monthLabels.map((month) => ({
          name: month,
          value: bookingCountsByMonth[month] || 0,
        })),
      },
    ];

    const orderStatusCounts = orders.reduce(
      (acc, o) => {
        const status = o.status.toString();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    this.orderStatusDistribution = Object.keys(orderStatusCounts).map(
      (status) => ({
        name: status,
        value: orderStatusCounts[status],
      }),
    );

    const spendingByMonth = orders.reduce(
      (acc, o) => {
        if (!o.createdAt) return acc;
        const date = new Date(o.createdAt);
        if (Number.isNaN(date.getTime())) return acc;
        const month = date.toLocaleString("default", { month: "short" });
        acc[month] = (acc[month] || 0) + Number(o.totalAmount || 0);
        return acc;
      },
      {} as { [key: string]: number },
    );

    this.monthlySpending = monthLabels.map((month) => ({
      name: month,
      value: spendingByMonth[month] || 0,
    }));
  }

  private getLastSixMonths(): string[] {
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      labels.push(d.toLocaleString("default", { month: "short" }));
    }
    return labels;
  }

  getStatusClass(status: string | undefined): string {
    switch (status) {
      case "READY":
      case "SERVED":
      case "CONFIRMED":
        return "ok";
      case "PENDING":
      case "PLACING":
      case "PREPARING":
      case "PENDING_PAYMENT":
        return "warn";
      case "CANCELLED":
      case "NO_SHOW":
        return "bad";
      default:
        return "neutral";
    }
  }

  get greeting(): string {
    const h = this.currentDateTime.getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  }

  get greetingIcon(): string {
    const h = this.currentDateTime.getHours();
    if (h < 12) return "wb_sunny";
    if (h < 18) return "light_mode";
    return "nights_stay";
  }

  get dateTimeFormatted(): string {
    const date = this.currentDateTime.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const time = this.currentDateTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${date} | ${time}`;
  }

  get displayName(): string {
    return this.user?.firstName || this.user?.username || "there";
  }

  get resolvedAvatarUrl(): string {
    return this.apiService.resolveImageUrl(
      this.user?.profileImageUrl ?? this.user?.avatarUrl,
    );
  }

  formatInrCurrency(amount: number | string | null | undefined): string {
    const normalized = Number(amount || 0);
    const safeAmount = Number.isFinite(normalized) ? normalized : 0;
    return `₹${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount)}`;
  }
}
