import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { forkJoin, of, interval, Subscription } from "rxjs";
import { catchError, distinctUntilChanged } from "rxjs/operators";

import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { OwnerDashboard } from "@shared/models/dashboard.model";
import { CafeContextService } from "../services/cafe-context.service";
import { AuthService } from "@core/auth/auth.service";
import { User } from "@shared/models/auth.model";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface StaffBreakdown {
  chefs: number;
  waiters: number;
  others: number;
}
interface BookingItem {
  id: number;
  customerName: string;
  date: string;
  time: string;
  tableNumber: string;
  guests: number;
  status: string;
}
interface RecentOrder {
  id: number;
  amount: number;
  status: string;
  tableNumber: string;
  createdAt: string;
}

@Component({
  selector: "app-cafe-owner-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./owner-dashboard.component.html",
  styleUrls: ["./owner-dashboard.component.scss"],
})
export class CafeOwnerDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  loading = true;
  refreshing = false;
  hasLoadedOnce = false;
  cafeId!: number;
  cafeName = "";
  lastRefreshed = new Date();

  user: User | null = null;
  currentDateTime = new Date();
  private clockTimerId?: ReturnType<typeof setInterval>;

  stats = {
    totalTables: 0,
    availableTables: 0,
    occupiedTables: 0,
    totalStaff: 0,
    activeStaff: 0,
    staffBreakdown: { chefs: 0, waiters: 0, others: 0 } as StaffBreakdown,
    todayOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    todayBookings: 0,
    upcomingBookingsCount: 0,
    totalMenuItems: 0,
    availableMenuItems: 0,
  };

  upcomingBookings: BookingItem[] = [];
  recentOrders: RecentOrder[] = [];
  popularItems: { name: string; orders: number; revenue: number }[] = [];
  orderStatusCounts: { label: string; count: number; color: string }[] = [];

  @ViewChild("revenueChart") revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("orderStatusChart")
  orderStatusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("tableChart") tableChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("popularChart") popularChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  private viewInitialized = false;
  private pollingSubscription?: Subscription;
  private cafeContextSubscription?: Subscription;
  private readonly POLL_INTERVAL_MS = 30_000;

  quickActions = [
    {
      label: "Manage Tables",
      icon: "\u{1FA91}",
      route: "/owner/tables",
      color: "blue",
    },
    {
      label: "View Orders",
      icon: "\u{1F4CB}",
      route: "/owner/orders",
      color: "orange",
    },
    {
      label: "Manage Staff",
      icon: "\u{1F465}",
      route: "/owner/staff",
      color: "purple",
    },
    {
      label: "Menu Items",
      icon: "\u{1F37D}\uFE0F",
      route: "/owner/menu",
      color: "green",
    },
    {
      label: "Bookings",
      icon: "\u{1F4C5}",
      route: "/owner/bookings",
      color: "cyan",
    },
    {
      label: "Cafe Settings",
      icon: "\u2699\uFE0F",
      route: "/owner/settings",
      color: "gray",
    },
  ];

  readonly tableIcon = "\u{1FA91}";
  readonly staffIcon = "\u{1F465}";
  readonly ordersIcon = "\u{1F4CB}";
  readonly revenueIcon = "\u{1F4B0}";
  readonly bookingIcon = "\u{1F4C5}";
  readonly menuIcon = "\u{1F37D}\uFE0F";
  readonly chefIcon = "\u{1F468}\u200D\u{1F373}";
  readonly waiterIcon = "\u{1F935}";
  readonly calIcon = "\u{1F4C5}";

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cafeCtx: CafeContextService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => (this.user = user));
    this.startClock();

    this.cafeContextSubscription = this.cafeCtx.activeCafe$
      .pipe(distinctUntilChanged((a, b) => a?.id === b?.id))
      .subscribe((cafe) => {
        if (!cafe?.id) {
          return;
        }
        const changedCafe = this.cafeId !== cafe.id;
        this.cafeId = cafe.id;
        this.cafeName = cafe.name || "My Cafe";
        if (changedCafe) {
          this.fetchAllDashboardData();
        }
      });

    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.clockTimerId) {
      clearInterval(this.clockTimerId);
    }
    this.pollingSubscription?.unsubscribe();
    this.cafeContextSubscription?.unsubscribe();
    this.destroyCharts();
  }

  private startClock(): void {
    this.clockTimerId = setInterval(() => {
      this.currentDateTime = new Date();
    }, 1000);
  }

  private startPolling(): void {
    this.pollingSubscription = interval(this.POLL_INTERVAL_MS).subscribe(() => {
      if (this.cafeId) {
        this.silentRefresh();
      }
    });
  }

  private silentRefresh(): void {
    this.fetchAllDashboardData(true);
  }

  loadDashboard(isRefresh = false): void {
    if (isRefresh || this.hasLoadedOnce) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }

    // Use the context-selected cafe when available; otherwise load via API
    const activeCafe = this.cafeCtx.activeCafe;
    if (activeCafe) {
      this.cafeId = activeCafe.id;
      this.cafeName = activeCafe.name || "My Cafe";
      this.fetchAllDashboardData();
      return;
    }

    this.apiService.getMyCafe().subscribe({
      next: (cafe) => {
        // Skip if activeCafe$ subscription already resolved a cafe (race condition guard)
        if (this.cafeId) {
          this.loading = false;
          this.refreshing = false;
          return;
        }
        this.cafeId = cafe.id;
        this.cafeName = cafe.name || "My Cafe";
        this.fetchAllDashboardData();
      },
      error: () => {
        this.loading = false;
        this.refreshing = false;
        this.router.navigate(["/owner/cafes"]);
      },
    });
  }

  fetchAllDashboardData(silent = false): void {
    forkJoin({
      owner: this.apiService
        .getOwnerDashboard(this.cafeId)
        .pipe(catchError(() => of(null))),
      tables: this.apiService
        .getTablesByCafe(this.cafeId)
        .pipe(catchError(() => of([]))),
      staff: this.apiService
        .getStaffByCafe(this.cafeId)
        .pipe(catchError(() => of([]))),
      orders: this.apiService
        .getOrdersByCafe(this.cafeId)
        .pipe(catchError(() => of([]))),
      bookings: this.apiService
        .getBookingsByCafe(this.cafeId)
        .pipe(catchError(() => of([]))),
      menu: this.apiService
        .getMenuItemsByCafe(this.cafeId)
        .pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ owner, tables, staff, orders, bookings, menu }) => {
        this.resetStats();
        this.processOwnerDashboard(owner as OwnerDashboard | null);
        this.processTables(tables as any[]);
        this.processStaff(staff as any[]);
        this.processOrders(orders as any[]);
        this.processBookings(bookings as any[]);
        this.processMenu(menu as any[]);

        this.hasLoadedOnce = true;
        this.loading = false;
        this.refreshing = false;
        this.lastRefreshed = new Date();
        this.cdr.detectChanges();

        if (this.viewInitialized) {
          setTimeout(() => this.renderAllCharts(), 50);
        }
      },
      error: () => {
        this.loading = false;
        this.refreshing = false;
        if (!silent) {
          this.alertService.error("Failed to load dashboard data.");
        }
      },
    });
  }

  private resetStats(): void {
    this.stats = {
      totalTables: 0,
      availableTables: 0,
      occupiedTables: 0,
      totalStaff: 0,
      activeStaff: 0,
      staffBreakdown: { chefs: 0, waiters: 0, others: 0 },
      todayOrders: 0,
      pendingOrders: 0,
      preparingOrders: 0,
      completedOrders: 0,
      todayRevenue: 0,
      weekRevenue: 0,
      todayBookings: 0,
      upcomingBookingsCount: 0,
      totalMenuItems: 0,
      availableMenuItems: 0,
    };
    this.orderStatusCounts = [];
    this.popularItems = [];
  }

  private processOwnerDashboard(data: OwnerDashboard | null): void {
    if (!data) return;
    this.stats.todayOrders = data.todayOrders ?? 0;
    this.stats.todayRevenue = data.todayRevenue ?? 0;
    this.stats.todayBookings = data.todayBookings ?? 0;
    this.stats.pendingOrders = data.pendingOrders ?? 0;
    this.stats.activeStaff = data.activeStaff ?? 0;

    if (data.popularItems?.length) {
      this.popularItems = data.popularItems.slice(0, 5).map((p) => ({
        name: p.menuItemName,
        orders: p.orderCount,
        revenue: p.totalRevenue,
      }));
    }
    if (data.revenueData?.length) {
      this.stats.weekRevenue = data.revenueData.reduce(
        (s, r) => s + (r.revenue ?? 0),
        0,
      );
    }
    if (data.orderStatusCounts) {
      const colorMap: Record<string, string> = {
        COMPLETED: "#22c55e",
        PENDING: "#f59e0b",
        PREPARING: "#6366f1",
        CANCELLED: "#ef4444",
        SERVED: "#06b6d4",
        IN_PROGRESS: "#8b5cf6",
      };
      this.orderStatusCounts = Object.entries(data.orderStatusCounts).map(
        ([label, count]) => ({
          label,
          count: count as number,
          color: colorMap[label.toUpperCase()] ?? "#94a3b8",
        }),
      );
    }
  }

  private processTables(tables: any[]): void {
    this.stats.totalTables = tables.length;
    this.stats.availableTables = tables.filter((t) => t.isAvailable).length;
    this.stats.occupiedTables =
      this.stats.totalTables - this.stats.availableTables;
  }

  private processStaff(staff: any[]): void {
    this.stats.totalStaff = staff.length;
    if (!this.stats.activeStaff) {
      this.stats.activeStaff = staff.filter((s) => s.isActive).length;
    }
    const chefs = staff.filter(
      (s) => s.roles?.includes("CHEF") || s.role === "CHEF",
    ).length;
    const waiters = staff.filter(
      (s) => s.roles?.includes("WAITER") || s.role === "WAITER",
    ).length;
    this.stats.staffBreakdown = {
      chefs,
      waiters,
      others: staff.length - chefs - waiters,
    };
  }

  private processOrders(orders: any[]): void {
    if (!this.stats.todayOrders) this.stats.todayOrders = orders.length;
    if (!this.stats.pendingOrders)
      this.stats.pendingOrders = orders.filter(
        (o) => o.status === "PENDING",
      ).length;
    this.stats.preparingOrders = orders.filter(
      (o) => o.status === "PREPARING",
    ).length;
    this.stats.completedOrders = orders.filter(
      (o) => o.status === "COMPLETED",
    ).length;
    if (!this.stats.todayRevenue) {
      this.stats.todayRevenue = orders.reduce(
        (s, o) => s + (o.totalAmount ?? 0),
        0,
      );
    }
    if (!this.orderStatusCounts.length) {
      const map: Record<string, number> = {};
      orders.forEach((o) => {
        map[o.status] = (map[o.status] ?? 0) + 1;
      });
      const colorMap: Record<string, string> = {
        COMPLETED: "#22c55e",
        PENDING: "#f59e0b",
        PREPARING: "#6366f1",
        CANCELLED: "#ef4444",
        SERVED: "#06b6d4",
      };
      this.orderStatusCounts = Object.entries(map).map(([label, count]) => ({
        label,
        count,
        color: colorMap[label] ?? "#94a3b8",
      }));
    }
    this.recentOrders = orders.slice(0, 8).map((o) => ({
      id: o.id,
      amount: o.totalAmount ?? 0,
      status: o.status ?? "UNKNOWN",
      tableNumber: o.tableNumber ?? String(o.tableId ?? "-"),
      createdAt: o.createdAt ?? "",
    }));
  }

  private processBookings(bookings: any[]): void {
    if (!this.stats.todayBookings) this.stats.todayBookings = bookings.length;
    this.stats.upcomingBookingsCount = bookings.filter(
      (b) => b.status !== "CANCELLED" && b.status !== "COMPLETED",
    ).length;
    this.upcomingBookings = bookings
      .filter((b) => b.status !== "CANCELLED" && b.status !== "COMPLETED")
      .slice(0, 6)
      .map((b) => ({
        id: b.id,
        customerName: b.customerName || `Customer #${b.customerId ?? "-"}`,
        date: b.bookingDate ?? "",
        time: b.bookingTime ?? b.startTime ?? "",
        tableNumber: b.tableNumber ?? String(b.tableId ?? "-"),
        guests: b.numberOfGuests ?? 1,
        status: b.status ?? "BOOKED",
      }));
  }

  private processMenu(menu: any[]): void {
    this.stats.totalMenuItems = menu.length;
    this.stats.availableMenuItems = menu.filter((m) => m.isAvailable).length;
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  private renderAllCharts(): void {
    this.destroyCharts();
    this.renderRevenueChart();
    this.renderOrderStatusChart();
    this.renderTableChart();
    this.renderPopularChart();
  }

  private renderRevenueChart(): void {
    if (!this.revenueChartRef?.nativeElement) return;
    const ctx = this.revenueChartRef.nativeElement;
    this.apiService
      .getOwnerDashboard(this.cafeId)
      .pipe(catchError(() => of(null)))
      .subscribe((d) => {
        let labels: string[] = [];
        let data: number[] = [];
        if (d?.revenueData?.length) {
          labels = d.revenueData.slice(-7).map((r: any) => {
            const dt = new Date(r.date);
            return dt.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
            });
          });
          data = d.revenueData.slice(-7).map((r: any) => r.revenue ?? 0);
        } else {
          for (let i = 6; i >= 0; i--) {
            const d2 = new Date();
            d2.setDate(d2.getDate() - i);
            labels.push(
              d2.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
              }),
            );
            data.push(0);
          }
        }
        const chart = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Revenue (\u20B9)",
                data,
                fill: true,
                borderColor: "#818cf8",
                backgroundColor: "rgba(129,140,248,0.15)",
                tension: 0.45,
                pointBackgroundColor: "#818cf8",
                pointRadius: 5,
                pointHoverRadius: 8,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    ` \u20B9${(ctx.parsed.y ?? 0).toLocaleString("en-IN")}`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: "rgba(255,255,255,0.07)" },
                ticks: {
                  color: "#94a3b8",
                  callback: (v) =>
                    `\u20B9${Number(v ?? 0).toLocaleString("en-IN")}`,
                },
              },
              x: {
                grid: { display: false },
                ticks: { color: "#94a3b8", font: { size: 11 } },
              },
            },
          },
        });
        this.charts.push(chart);
      });
  }

  private renderOrderStatusChart(): void {
    if (
      !this.orderStatusChartRef?.nativeElement ||
      !this.orderStatusCounts.length
    )
      return;
    const chart = new Chart(this.orderStatusChartRef.nativeElement, {
      type: "doughnut",
      data: {
        labels: this.orderStatusCounts.map((s) => s.label),
        datasets: [
          {
            data: this.orderStatusCounts.map((s) => s.count),
            backgroundColor: this.orderStatusCounts.map((s) => s.color),
            borderWidth: 2,
            borderColor: "#1e293b",
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: { legend: { display: false } },
      },
    });
    this.charts.push(chart);
  }

  private renderTableChart(): void {
    if (!this.tableChartRef?.nativeElement) return;
    const chart = new Chart(this.tableChartRef.nativeElement, {
      type: "doughnut",
      data: {
        labels: ["Available", "Occupied"],
        datasets: [
          {
            data: [
              this.stats.availableTables || 1,
              this.stats.occupiedTables || 0,
            ],
            backgroundColor: ["#22c55e", "#ef4444"],
            borderWidth: 2,
            borderColor: "#1e293b",
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: { legend: { display: false } },
      },
    });
    this.charts.push(chart);
  }

  private renderPopularChart(): void {
    if (!this.popularChartRef?.nativeElement) return;
    const items = this.popularItems.length
      ? this.popularItems
      : [{ name: "No Data", orders: 0, revenue: 0 }];
    const chart = new Chart(this.popularChartRef.nativeElement, {
      type: "bar",
      data: {
        labels: items.map((p) => p.name),
        datasets: [
          {
            label: "Orders",
            data: items.map((p) => p.orders),
            backgroundColor: [
              "#818cf8",
              "#34d399",
              "#fb923c",
              "#f472b6",
              "#38bdf8",
            ],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.07)" },
            ticks: { color: "#94a3b8", stepSize: 1 },
          },
          y: {
            grid: { display: false },
            ticks: { color: "#cbd5e1", font: { size: 12 } },
          },
        },
      },
    });
    this.charts.push(chart);
  }

  getOrderStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: "status-pending",
      PREPARING: "status-preparing",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
      SERVED: "status-served",
      READY: "status-served",
      IN_PROGRESS: "status-preparing",
    };
    return map[status?.toUpperCase()] ?? "status-default";
  }

  getBookingStatusClass(status: string): string {
    const map: Record<string, string> = {
      BOOKED: "status-booked",
      CONFIRMED: "status-confirmed",
      PENDING: "status-pending",
      CANCELLED: "status-cancelled",
      COMPLETED: "status-completed",
    };
    return map[status?.toUpperCase()] ?? "status-default";
  }

  get tableOccupancyPct(): number {
    if (!this.stats.totalTables) return 0;
    return Math.round(
      (this.stats.occupiedTables / this.stats.totalTables) * 100,
    );
  }

  get revenueGrowthLabel(): string {
    return this.stats.weekRevenue > 0
      ? `\u20B9${this.stats.weekRevenue.toLocaleString("en-IN")} this week`
      : "No data yet";
  }

  formatCurrency(v: number): string {
    if (!v) return "\u20B90";
    if (v >= 100_000) return `\u20B9${(v / 100_000).toFixed(1)}L`;
    if (v >= 1_000) return `\u20B9${(v / 1_000).toFixed(1)}K`;
    return `\u20B9${v.toLocaleString("en-IN")}`;
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }

  refresh(): void {
    this.loadDashboard(true);
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
      this.user?.profileImageUrl ?? (this.user as any)?.avatarUrl,
    );
  }
}
