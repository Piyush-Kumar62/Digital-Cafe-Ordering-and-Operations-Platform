import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { uppercaseMeridiem } from "@core/utils/date-time-format.util";
import { Order, OrderStatus } from "@shared/models/order.model";
import { WaiterDashboard } from "@shared/models/dashboard.model";
import { User } from "@shared/models/auth.model";
import { Subject, interval, takeUntil, forkJoin, of } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Component({
  selector: "app-waiter-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./waiter-dashboard.component.html",
  styleUrls: ["./waiter-dashboard.component.scss"],
})
export class WaiterDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  refreshing = false;
  hasLoadedOnce = false;
  readyOrders: Order[] = [];
  placedOrders: Order[] = [];
  preparingOrders: Order[] = [];
  servedToday = 0;
  activeOrders = 0;
  cafeName = "";
  cafeId: number | null = null;
  lastRefreshed = new Date();
  currentTime = new Date();
  currentUser: User | null = null;
  errorMessage = "";

  private destroy$ = new Subject<void>();

  pageIndex = 0;
  readonly pageSize = 10;

  get pagedReadyOrders(): Order[] {
    return this.readyOrders.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.readyOrders.length;
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }
  get rangeStart(): number {
    return this.totalElements === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }
  get allPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get queueOrders(): Order[] {
    return [...this.placedOrders, ...this.preparingOrders]
      .sort((a, b) => {
        const aTime = new Date(
          a.preparingAt || a.placedAt || a.createdAt || 0,
        ).getTime();
        const bTime = new Date(
          b.preparingAt || b.placedAt || b.createdAt || 0,
        ).getTime();
        return aTime - bTime;
      })
      .slice(0, 6);
  }

  get hasQueueOrders(): boolean {
    return this.queueOrders.length > 0;
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertService: AlertService,
    private webSocketService: WebSocketService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.currentUser = user;
    this.cafeId = user?.cafeId ?? null;
    this.loadData();
    this.subscribeRealtime();
    // Auto-refresh every 30 seconds
    interval(30_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime = new Date();
        this.loadData(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async markServed(orderId: number): Promise<void> {
    const confirmed = await this.alertService.confirm(
      "Confirm Service",
      "Mark this order as served?",
    );
    if (!confirmed) return;

    this.alertService.loading("Updating order status. Please wait.");
    this.apiService.markOrderServed(orderId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success("Order Served", "Order marked as served.");
        this.loadData(false);
      },
      error: () => {
        this.alertService.close();
        this.alertService.error(
          "Update Failed",
          "Failed to update order status.",
        );
      },
    });
  }

  getOrderAge(order: Order): string {
    const ts = order.readyAt || order.placedAt || order.createdAt;
    if (!ts) return "";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  }

  get greeting(): string {
    const h = this.currentTime.getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  }

  get dateTimeFormatted(): string {
    const date = this.currentTime.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const time = this.currentTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${date} | ${uppercaseMeridiem(time)}`;
  }

  get displayName(): string {
    const first = this.currentUser?.firstName || "";
    const last = this.currentUser?.lastName || "";
    const full = `${first} ${last}`.trim();
    return (
      this.currentUser?.displayName ||
      full ||
      this.currentUser?.username ||
      "Waiter"
    );
  }

  refreshData(): void {
    this.currentTime = new Date();
    this.refreshing = true;
    this.errorMessage = "";
    this.loadData(false);
  }

  isUrgent(order: Order): boolean {
    const ts = order.readyAt || order.placedAt || order.createdAt;
    if (!ts) return false;
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    return diff >= 5;
  }

  getStatusBadgeClass(order: Order): string {
    if (order.status === OrderStatus.PREPARING) return "wd-badge-status--prep";
    if (order.status === OrderStatus.PLACED) return "wd-badge-status--placed";
    return "wd-badge-status--ready";
  }

  getQueueActionLabel(order: Order): string {
    if (order.status === OrderStatus.PREPARING) return "In Progress";
    if (order.status === OrderStatus.PLACED) return "Awaiting Kitchen";
    return "Ready to Serve";
  }

  getQueueActionIcon(order: Order): string {
    if (order.status === OrderStatus.PREPARING) return "local_fire_department";
    if (order.status === OrderStatus.PLACED) return "restaurant";
    return "done_all";
  }

  getQueueActionClass(order: Order): string {
    if (order.status === OrderStatus.PREPARING) return "wd-queue-btn--prep";
    if (order.status === OrderStatus.PLACED) return "wd-queue-btn--placed";
    return "wd-queue-btn--ready";
  }

  private loadData(showSpinner = true): void {
    if (showSpinner && !this.hasLoadedOnce) {
      this.loading = true;
    }

    const ready$ = this.apiService.getReadyOrdersForWaiterWorkflow().pipe(
      map((orders) => ({ data: orders || [], failed: false })),
      catchError(() => of({ data: [] as Order[], failed: true })),
    );

    const placed$ = this.cafeId
      ? this.apiService.getOrdersByStatus(this.cafeId, OrderStatus.PLACED).pipe(
          map((orders) => ({ data: orders || [], failed: false })),
          catchError(() => of({ data: [] as Order[], failed: true })),
        )
      : of({ data: [] as Order[], failed: false });

    const preparing$ = this.cafeId
      ? this.apiService
          .getOrdersByStatus(this.cafeId, OrderStatus.PREPARING)
          .pipe(
            map((orders) => ({ data: orders || [], failed: false })),
            catchError(() => of({ data: [] as Order[], failed: true })),
          )
      : of({ data: [] as Order[], failed: false });

    const dashboard$ = this.cafeId
      ? this.apiService.getWaiterDashboard(this.cafeId).pipe(
          map((dashboard) => ({ data: dashboard, failed: false })),
          catchError(() =>
            of({ data: null as WaiterDashboard | null, failed: true }),
          ),
        )
      : of({ data: null as WaiterDashboard | null, failed: false });

    forkJoin({
      ready: ready$,
      placed: placed$,
      preparing: preparing$,
      dashboard: dashboard$,
    }).subscribe({
      next: ({ ready, placed, preparing, dashboard }) => {
        const previousPageIndex = this.pageIndex;
        this.readyOrders = ready.data;
        this.placedOrders = placed.data;
        this.preparingOrders = preparing.data;

        const maxPageIndex = Math.max(
          0,
          Math.ceil(this.readyOrders.length / this.pageSize) - 1,
        );
        this.pageIndex = Math.min(previousPageIndex, maxPageIndex);

        if (dashboard.data) {
          const d = dashboard.data;
          this.servedToday = d.servedToday ?? 0;
          this.activeOrders =
            d.activeOrders ??
            this.placedOrders.length + this.preparingOrders.length;
          this.cafeName = d.cafeName || "";
        } else {
          this.servedToday = 0;
          this.activeOrders =
            this.placedOrders.length + this.preparingOrders.length;
        }

        this.errorMessage =
          ready.failed || placed.failed || preparing.failed || dashboard.failed
            ? "Some dashboard data could not be refreshed. Showing available data."
            : "";

        this.lastRefreshed = new Date();
        this.hasLoadedOnce = true;
        this.loading = false;
        this.refreshing = false;
      },
      error: () => {
        this.errorMessage = "Unable to load waiter dashboard right now.";
        this.loading = false;
        this.refreshing = false;
        this.hasLoadedOnce = true;
      },
    });
  }

  private subscribeRealtime(): void {
    this.webSocketService.orderNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        if (notification) {
          this.loadData(false);
        }
      });
  }

  retryLoad(): void {
    this.refreshData();
  }
}
