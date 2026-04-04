import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { ApiService } from "@core/services/api.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { Order, OrderStatus } from "@shared/models/order.model";
import { Subject, catchError, forkJoin, interval, of, takeUntil } from "rxjs";

@Component({
  selector: "app-waiter-active-orders",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./waiter-active-orders.component.html",
  styleUrls: ["./waiter-active-orders.component.scss"],
})
export class WaiterActiveOrdersComponent implements OnInit, OnDestroy {
  readonly pageSize = 12;
  readonly activeStatuses: OrderStatus[] = [
    OrderStatus.PLACED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
  ];

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  searchQuery = "";
  pageIndex = 0;
  loading = true;
  refreshing = false;
  loadHint = "";
  private cafeId: number | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private alertService: AlertService,
    private webSocketService: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.cafeId = this.authService.currentUserValue?.cafeId ?? null;
    this.loadOrders();

    // Realtime hook from default order stream.
    this.webSocketService.orderNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event) {
          this.loadOrders(false);
        }
      });

    // Explicit waiter topic subscription for robust updates in all sessions.
    if (this.cafeId) {
      this.webSocketService
        .watchDestination<any>(`/topic/waiter/${this.cafeId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadOrders(false));
    }

    // Safety sync in case a websocket event is missed.
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadOrders(false));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));
  }

  get rangeStart(): number {
    return this.filteredOrders.length === 0
      ? 0
      : this.pageIndex * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(
      (this.pageIndex + 1) * this.pageSize,
      this.filteredOrders.length,
    );
  }

  get pagedOrders(): Order[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get totalActiveOrders(): number {
    return this.orders.length;
  }

  get readyOrdersCount(): number {
    return this.orders.filter((o) => o.status === OrderStatus.READY).length;
  }

  refresh(): void {
    this.refreshing = true;
    this.loadOrders(false);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  goToPage(page: number): void {
    const nextIndex = page - 1;
    if (nextIndex < 0 || nextIndex >= this.totalPages) return;
    this.pageIndex = nextIndex;
  }

  async markServed(orderId: number): Promise<void> {
    const confirmed = await this.alertService.confirm(
      "Confirm Service",
      "Mark this order as served?",
    );
    if (!confirmed) return;

    this.apiService.markOrderServed(orderId).subscribe({
      next: () => {
        this.alertService.success("Order Served", "Order marked as served.");
        this.loadOrders(false);
      },
      error: () => {
        this.alertService.error(
          "Update Failed",
          "Unable to mark order as served.",
        );
      },
    });
  }

  getOrderTime(order: Order): string {
    const value =
      order.readyAt || order.preparingAt || order.placedAt || order.createdAt;
    if (!value) return "—";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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

  isUrgent(order: Order): boolean {
    const ts = order.readyAt || order.placedAt || order.createdAt;
    if (!ts) return false;
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    return diff >= 5;
  }

  private loadOrders(showSpinner = true): void {
    if (showSpinner) {
      this.loading = true;
      this.loadHint = "";
    }

    if (!this.cafeId) {
      this.loadReadyOnly(showSpinner);
      return;
    }

    forkJoin({
      placed: this.apiService
        .getOrdersByStatus(this.cafeId, OrderStatus.PLACED)
        .pipe(catchError(() => of([] as Order[]))),
      preparing: this.apiService
        .getOrdersByStatus(this.cafeId, OrderStatus.PREPARING)
        .pipe(catchError(() => of([] as Order[]))),
      ready: this.apiService
        .getOrdersByStatus(this.cafeId, OrderStatus.READY)
        .pipe(catchError(() => of([] as Order[]))),
      waiterReady: this.apiService
        .getReadyOrdersForWaiterWorkflow()
        .pipe(catchError(() => of([] as Order[]))),
    }).subscribe({
      next: ({ placed, preparing, ready, waiterReady }) => {
        const merged = [...placed, ...preparing, ...ready, ...waiterReady];
        const byId = new Map<number, Order>();
        merged.forEach((order) => {
          if (!order?.id) return;
          byId.set(order.id, order);
        });

        this.orders = Array.from(byId.values())
          .filter((o) => this.activeStatuses.includes(o.status))
          .sort((a, b) => {
            const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return bTime - aTime;
          });

        // If backend status endpoints are restricted, waiter-ready still renders list.
        if (
          placed.length === 0 &&
          preparing.length === 0 &&
          ready.length === 0 &&
          waiterReady.length > 0
        ) {
          this.loadHint = "Showing ready orders based on waiter workflow feed.";
        }

        this.applyFilters();
        this.loading = false;
        this.refreshing = false;
      },
      error: () => this.loadReadyOnly(showSpinner),
    });
  }

  private loadReadyOnly(showSpinner: boolean): void {
    this.apiService.getReadyOrdersForWaiterWorkflow().subscribe({
      next: (readyOrders) => {
        this.orders = (readyOrders || [])
          .filter((o) => this.activeStatuses.includes(o.status))
          .sort((a, b) => {
            const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return bTime - aTime;
          });
        this.loadHint = this.orders.length
          ? "Showing ready orders based on waiter workflow feed."
          : "";
        this.applyFilters();
        this.loading = false;
        this.refreshing = false;
      },
      error: () => {
        this.orders = [];
        this.filteredOrders = [];
        this.loading = false;
        this.refreshing = false;
        this.loadHint = "Unable to load active orders from server.";
        if (!showSpinner) {
          return;
        }
        this.alertService.error("Load Failed", "Unable to load active orders.");
      },
    });
  }

  private applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredOrders = this.orders.filter((order) => {
      if (!query) return true;

      return (
        String(order.orderNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(order.tableNumber || order.tableId || "")
          .toLowerCase()
          .includes(query) ||
        String(order.customerName || "")
          .toLowerCase()
          .includes(query)
      );
    });

    const maxPageIndex = Math.max(0, this.totalPages - 1);
    this.pageIndex = Math.min(this.pageIndex, maxPageIndex);
  }
}
