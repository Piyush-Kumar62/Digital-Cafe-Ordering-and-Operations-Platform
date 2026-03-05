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
  templateUrl: "./order-management.component.html",
  styleUrls: ["./order-management.component.scss"],
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

  pageIndex = 0;
  readonly pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  get rangeStart(): number {
    return this.totalElements === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }
  get allPages(): number[] {
    return Array.from({ length: Math.max(this.totalPages, 1) }, (_, i) => i);
  }
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
    this.loadOrders();
  }

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const saved = Number(localStorage.getItem("admin_refresh_seconds") || 10);
    this.refreshSeconds = Number.isNaN(saved) ? 10 : Math.max(5, saved);
    this.loadCafes();
    this.refreshTimer = setInterval(
      () => this.loadOrders(),
      this.refreshSeconds * 1000,
    );
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
        this.pageIndex = 0;
        this.loadOrders();
      },
      error: (error) =>
        this.alertService.error(error?.message || "Failed to load cafes"),
    });
  }

  loadOrders(): void {
    if (!this.selectedCafeId) return;
    this.loading = true;
    this.apiService
      .getCafeOrdersForAdmin(this.selectedCafeId, this.pageIndex, this.pageSize)
      .subscribe({
        next: (res) => {
          this.orders = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.totalPages = res.totalPages || 0;
          this.orders.forEach(
            (o) => (this.statusMap[o.id] = this.statusMap[o.id] || o.status),
          );
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
      error: (error) =>
        this.alertService.error(error?.message || "Status update failed"),
    });
  }

  getPlacedAt(order: Order): string {
    const placed = (order as unknown as { placedAt?: string }).placedAt;
    return placed || order.createdAt || "-";
  }
}
