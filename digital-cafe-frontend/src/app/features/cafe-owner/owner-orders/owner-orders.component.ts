import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Order } from "@shared/models/order.model";

@Component({
  selector: "app-owner-orders",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./owner-orders.component.html",
  styleUrls: ["./owner-orders.component.scss"],
})
export class OwnerOrdersComponent implements OnInit {
  orders: Order[] = [];
  cafeId: number | null = null;
  loading = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.apiService.cafeExistsForOwner().subscribe({
      next: (exists) => {
        if (!exists) {
          this.router.navigate(["/owner/setup"]);
          return;
        }
        this.apiService.getMyCafe().subscribe({
          next: (cafe) => {
            this.cafeId = cafe.id;
            this.fetchOrders();
          },
          error: () => this.router.navigate(["/owner/setup"]),
        });
      },
      error: () => this.router.navigate(["/owner/setup"]),
    });
  }

  fetchOrders(): void {
    if (!this.cafeId) return;
    this.loading = true;
    this.apiService.getOrdersByCafe(this.cafeId).subscribe({
      next: (orders) => {
        this.orders = orders || [];
        this.loading = false;
      },
      error: () => {
        this.orders = [];
        this.loading = false;
      },
    });
  }

  countBy(status: string): number {
    return this.orders.filter((o) => String(o.status) === status).length;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: "status-pending",
      PLACED: "status-pending",
      CONFIRMED: "status-confirmed",
      PREPARING: "status-preparing",
      READY: "status-ready",
      SERVED: "status-served",
      COMPLETED: "status-served",
      CANCELLED: "status-cancelled",
    };
    return map[status?.toUpperCase()] || "status-default";
  }
}
