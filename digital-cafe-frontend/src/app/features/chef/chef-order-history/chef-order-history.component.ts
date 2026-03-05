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
        this.orders = orders.filter(
          (o) => o.status === OrderStatus.READY || o.status === OrderStatus.SERVED,
        );
        this.isLoading = false;
      },
      error: () => {
        this.alertService.error("Load Failed", "Unable to load order history.");
        this.isLoading = false;
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case "READY": return "status-ready";
      case "SERVED": return "status-served";
      default: return "status-default";
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
