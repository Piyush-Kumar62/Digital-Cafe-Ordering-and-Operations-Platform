import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { AlertService } from "@core/services/alert.service";
import { Order, OrderStatus } from "@shared/models/order.model";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-chef-orders",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./chef-orders.component.html",
  styleUrls: ["./chef-orders.component.scss"],
})
export class ChefOrdersComponent implements OnInit, OnDestroy {
  allOrders: Order[] = [];
  filteredOrders: Order[] = [];
  activeTab: "ALL" | "PLACED" | "PREPARING" | "READY" = "ALL";
  searchQuery = "";
  isLoading = true;
  private destroy$ = new Subject<void>();

  readonly tabs = [
    { key: "ALL" as const, label: "All Orders", icon: "bi-grid" },
    { key: "PLACED" as const, label: "Pending", icon: "bi-hourglass-split" },
    { key: "PREPARING" as const, label: "Preparing", icon: "bi-fire" },
    { key: "READY" as const, label: "Ready", icon: "bi-check-circle" },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.webSocketService.orderNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((order) => {
        if (order) this.loadOrders();
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
        this.allOrders = orders;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error("Load Failed", "Unable to load orders.");
        this.isLoading = false;
      },
    });
  }

  setTab(tab: "ALL" | "PLACED" | "PREPARING" | "READY"): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  applyFilters(): void {
    let orders = this.allOrders;
    if (this.activeTab !== "ALL") {
      orders = orders.filter((o) => o.status === this.activeTab);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      orders = orders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.tableNumber?.toLowerCase().includes(q),
      );
    }
    this.filteredOrders = orders;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  getTabCount(tab: string): number {
    if (tab === "ALL") return this.allOrders.length;
    return this.allOrders.filter((o) => o.status === tab).length;
  }

  startPreparing(orderId: number): void {
    this.apiService.markOrderPreparing(orderId).subscribe({
      next: () => {
        this.alertService.success("Started", "Order is now being prepared.");
        this.loadOrders();
      },
      error: () => {
        this.alertService.error("Failed", "Could not update order status.");
      },
    });
  }

  markReady(orderId: number): void {
    this.apiService.markOrderReady(orderId).subscribe({
      next: () => {
        this.alertService.success("Ready", "Order marked as ready.");
        this.loadOrders();
      },
      error: () => {
        this.alertService.error("Failed", "Could not update order status.");
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case "PLACED": return "status-pending";
      case "PREPARING": return "status-preparing";
      case "READY": return "status-ready";
      default: return "status-default";
    }
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
}
