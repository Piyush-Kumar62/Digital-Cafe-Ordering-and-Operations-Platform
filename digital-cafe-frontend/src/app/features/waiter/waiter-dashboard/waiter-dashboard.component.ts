import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { Order } from "@shared/models/order.model";
import { WaiterDashboard } from "@shared/models/dashboard.model";
import { Subject, interval, takeUntil, forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";

@Component({
  selector: "app-waiter-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./waiter-dashboard.component.html",
  styleUrls: ["./waiter-dashboard.component.scss"],
})
export class WaiterDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  readyOrders: Order[] = [];
  servedToday = 0;
  activeOrders = 0;
  cafeName = "";
  cafeId: number | null = null;
  lastRefreshed = new Date();

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
    this.cafeId = user?.cafeId ?? null;
    this.loadData();
    this.subscribeRealtime();
    // Auto-refresh every 30 seconds
    interval(30_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData(false));
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

  isUrgent(order: Order): boolean {
    const ts = order.readyAt || order.placedAt || order.createdAt;
    if (!ts) return false;
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    return diff >= 5;
  }

  private loadData(showSpinner = true): void {
    if (showSpinner) this.loading = true;

    const orders$ = this.apiService
      .getReadyOrdersForWaiterWorkflow()
      .pipe(catchError(() => of([] as Order[])));

    const dashboard$ = this.cafeId
      ? this.apiService
          .getWaiterDashboard(this.cafeId)
          .pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({ orders: orders$, dashboard: dashboard$ }).subscribe({
      next: ({ orders, dashboard }) => {
        this.readyOrders = orders || [];
        this.pageIndex = 0;
        if (dashboard) {
          const d = dashboard as WaiterDashboard;
          this.servedToday = d.servedToday ?? 0;
          this.activeOrders = d.activeOrders ?? 0;
          this.cafeName = d.cafeName || "";
        } else {
          this.servedToday = this.calculateServedToday(this.readyOrders);
        }
        this.lastRefreshed = new Date();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
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

  private calculateServedToday(orders: Order[]): number {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => o.servedAt?.slice(0, 10) === today).length;
  }
}
