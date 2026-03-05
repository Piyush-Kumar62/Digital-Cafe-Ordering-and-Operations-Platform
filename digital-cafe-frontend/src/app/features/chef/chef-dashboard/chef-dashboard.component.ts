import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { Order, OrderStatus } from "@shared/models/order.model";
import { AlertService } from "@core/services/alert.service";
import { Subject, takeUntil, interval } from "rxjs";

@Component({
  selector: "app-chef-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./chef-dashboard.component.html",
  styleUrls: ["./chef-dashboard.component.scss"],
})
export class ChefDashboardComponent implements OnInit, OnDestroy {
  pendingOrders: Order[] = [];
  preparingOrders: Order[] = [];
  readyOrders: Order[] = [];
  cafeId: number | null = null;
  currentTime = new Date();
  isLoading = true;
  private destroy$ = new Subject<void>();

  readonly pageSize = 10;
  pendingPage = 0;
  preparingPage = 0;

  get pagedPending(): Order[] {
    return this.pendingOrders.slice(
      this.pendingPage * this.pageSize,
      (this.pendingPage + 1) * this.pageSize,
    );
  }

  get pagedPreparing(): Order[] {
    return this.preparingOrders.slice(
      this.preparingPage * this.pageSize,
      (this.preparingPage + 1) * this.pageSize,
    );
  }

  get pendingTotalPages(): number {
    return Math.max(1, Math.ceil(this.pendingOrders.length / this.pageSize));
  }

  get preparingTotalPages(): number {
    return Math.max(1, Math.ceil(this.preparingOrders.length / this.pageSize));
  }

  get pendingAllPages(): number[] {
    return Array.from({ length: this.pendingTotalPages }, (_, i) => i);
  }

  get preparingAllPages(): number[] {
    return Array.from({ length: this.preparingTotalPages }, (_, i) => i);
  }

  get pendingRangeStart(): number {
    return this.pendingOrders.length === 0
      ? 0
      : this.pendingPage * this.pageSize + 1;
  }

  get pendingRangeEnd(): number {
    return Math.min(
      (this.pendingPage + 1) * this.pageSize,
      this.pendingOrders.length,
    );
  }

  get preparingRangeStart(): number {
    return this.preparingOrders.length === 0
      ? 0
      : this.preparingPage * this.pageSize + 1;
  }

  get preparingRangeEnd(): number {
    return Math.min(
      (this.preparingPage + 1) * this.pageSize,
      this.preparingOrders.length,
    );
  }

  get totalOrdersToday(): number {
    return (
      this.pendingOrders.length +
      this.preparingOrders.length +
      this.readyOrders.length
    );
  }

  goToPending(page: number): void {
    if (page >= 0 && page < this.pendingTotalPages) this.pendingPage = page;
  }

  goToPreparing(page: number): void {
    if (page >= 0 && page < this.preparingTotalPages) this.preparingPage = page;
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user && user.cafeId) {
      this.cafeId = user.cafeId;
      this.loadOrders();
      this.subscribeToOrderUpdates();
    }
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime = new Date();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.apiService.getChefOrders().subscribe({
      next: (orders) => {
        this.categorizeOrders(orders);
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error(
          "Load Failed",
          "Unable to load kitchen orders.",
        );
        this.isLoading = false;
      },
    });
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  categorizeOrders(orders: Order[]): void {
    this.pendingOrders = orders.filter((o) => o.status === OrderStatus.PLACED);
    this.preparingOrders = orders.filter(
      (o) => o.status === OrderStatus.PREPARING,
    );
    this.readyOrders = orders.filter((o) => o.status === OrderStatus.READY);
    this.pendingPage = 0;
    this.preparingPage = 0;
  }

  subscribeToOrderUpdates(): void {
    this.webSocketService.orderNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((order) => {
        if (order) {
          this.alertService.info(`New order received: #${order.orderNumber}`);
          this.loadOrders();
        }
      });
  }

  startPreparing(orderId: number): void {
    this.alertService.loading("Marking order as Preparing...");
    this.apiService.markOrderPreparing(orderId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success(
          "Kitchen Started",
          "Order is now being prepared.",
        );
        this.loadOrders();
      },
      error: () => {
        this.alertService.close();
        this.alertService.error(
          "Update Failed",
          "Failed to mark order as Preparing.",
        );
      },
    });
  }

  markReady(orderId: number): void {
    this.alertService.loading("Marking order as Ready...");
    this.apiService.markOrderReady(orderId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success(
          "Order Ready",
          "Order marked as Ready — notifying waiter.",
        );
        this.loadOrders();
      },
      error: () => {
        this.alertService.close();
        this.alertService.error(
          "Update Failed",
          "Failed to mark order as Ready.",
        );
      },
    });
  }

  getRelativeTime(dateStr: string | undefined): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  }

  /** @deprecated kept for backward compat — prefer startPreparing / markReady */
  updateOrderStatus(orderId: number, status: string): void {
    if (status === "PREPARING") {
      this.startPreparing(orderId);
    } else {
      this.markReady(orderId);
    }
  }
}
