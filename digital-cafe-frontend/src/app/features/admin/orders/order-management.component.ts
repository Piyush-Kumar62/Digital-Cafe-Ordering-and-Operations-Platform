import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { Order } from "@shared/models/order.model";
import { Cafe } from "@shared/models/cafe.model";

@Component({
  selector: "app-order-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss'],
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  cafes: Cafe[] = [];
  selectedCafeId: number | null = null;
  orders: Order[] = [];
  loading = false;
  statusMap: Record<number, string> = {};
  statuses = ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"];
  refreshTimer: any = null;
  refreshSeconds = 10;

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const saved = Number(localStorage.getItem("admin_refresh_seconds") || 10);
    this.refreshSeconds = Number.isNaN(saved) ? 10 : Math.max(5, saved);
    this.loadCafes();
    this.refreshTimer = setInterval(() => this.loadOrders(), this.refreshSeconds * 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadCafes(): void {
    this.apiService.getAdminCafes(0, 200).subscribe({
      next: (res) => {
        this.cafes = res.content || [];
        if (!this.selectedCafeId && this.cafes.length) {
          this.selectedCafeId = this.cafes[0].id;
        }
        this.loadOrders();
      },
      error: (error) => this.alertService.error(error?.message || "Failed to load cafes"),
    });
  }

  loadOrders(): void {
    if (!this.selectedCafeId) return;
    this.loading = true;
    this.apiService.getCafeOrdersForAdmin(this.selectedCafeId, 0, 200).subscribe({
      next: (res) => {
        this.orders = res.content || [];
        this.orders.forEach((o) => (this.statusMap[o.id] = this.statusMap[o.id] || o.status));
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.alertService.error(error?.message || "Failed to load orders");
      },
    });
  }

  updateStatus(order: Order): void {
    const status = this.statusMap[order.id] || order.status;
    this.apiService.updateOrderStatusForAdmin(order.id, status).subscribe({
      next: () => {
        this.alertService.success("Order status updated.");
        this.loadOrders();
      },
      error: (error) => this.alertService.error(error?.message || "Status update failed"),
    });
  }

  getPlacedAt(order: Order): string {
    const placed = (order as unknown as { placedAt?: string }).placedAt;
    return placed || order.createdAt || "-";
  }
}


