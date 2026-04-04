import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { Order, OrderStatus } from "@shared/models/order.model";

@Component({
  selector: "app-chef-order-history",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./chef-order-history.component.html",
  styleUrls: ["./chef-order-history.component.scss"],
})
export class ChefOrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  currentPage = 1;
  readonly pageSize = 10;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.apiService.getChefOrders().subscribe({
      next: (orders) => {
        this.orders = orders
          .filter(
            (o) =>
              o.status === OrderStatus.READY || o.status === OrderStatus.SERVED,
          )
          .sort((a, b) => {
            const aTime = new Date(
              a.readyAt || a.servedAt || a.updatedAt || a.createdAt || 0,
            ).getTime();
            const bTime = new Date(
              b.readyAt || b.servedAt || b.updatedAt || b.createdAt || 0,
            ).getTime();
            return bTime - aTime;
          });
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error("Load Failed", "Unable to load order history.");
        this.isLoading = false;
      },
    });
  }

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.orders.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get readyCount(): number {
    return this.orders.filter((o) => o.status === OrderStatus.READY).length;
  }

  get servedCount(): number {
    return this.orders.filter((o) => o.status === OrderStatus.SERVED).length;
  }

  get rangeStart(): number {
    if (!this.orders.length) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.orders.length);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case "READY":
        return "status-ready";
      case "SERVED":
        return "status-served";
      default:
        return "status-default";
    }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
