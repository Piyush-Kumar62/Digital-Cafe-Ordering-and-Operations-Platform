import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { ApiService } from "@core/services/api.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { Order, OrderStatus } from "@shared/models/order.model";
import { Subject, interval, takeUntil } from "rxjs";

@Component({
  selector: "app-waiter-served-history",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./waiter-served-history.component.html",
  styleUrls: ["./waiter-served-history.component.scss"],
})
export class WaiterServedHistoryComponent implements OnInit, OnDestroy {
  readonly pageSize = 12;

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  searchQuery = "";
  pageIndex = 0;
  loading = true;
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

    this.webSocketService.orderNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event) {
          this.loadOrders();
        }
      });

    if (this.cafeId) {
      this.webSocketService
        .watchDestination<any>(`/topic/waiter/${this.cafeId}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.loadOrders());
    }

    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadOrders());
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

  onSearchChange(): void {
    this.applyFilters();
  }

  goToPage(page: number): void {
    const nextIndex = page - 1;
    if (nextIndex < 0 || nextIndex >= this.totalPages) return;
    this.pageIndex = nextIndex;
  }

  formatServedAt(order: Order): string {
    const value = order.servedAt || order.updatedAt || order.createdAt;
    if (!value) return "—";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  private loadOrders(): void {
    this.loading = true;
    if (!this.cafeId) {
      this.orders = [];
      this.filteredOrders = [];
      this.loading = false;
      this.loadHint = "Missing cafe context for served history.";
      return;
    }

    this.apiService
      .getOrdersByStatus(this.cafeId, OrderStatus.SERVED)
      .subscribe({
        next: (orders) => {
          this.orders = (orders || [])
            .filter((o) => o.status === OrderStatus.SERVED)
            .sort((a, b) => {
              const aTime = new Date(a.servedAt || a.updatedAt || 0).getTime();
              const bTime = new Date(b.servedAt || b.updatedAt || 0).getTime();
              return bTime - aTime;
            });
          this.applyFilters();
          this.loading = false;
          this.loadHint = "";
        },
        error: () => {
          this.orders = [];
          this.filteredOrders = [];
          this.loading = false;
          this.loadHint =
            "Served history endpoint is unavailable for this account.";
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
