import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Order } from "@shared/models/order.model";

@Component({
  selector: "app-my-orders",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./my-orders.component.html",
  styleUrls: ["./my-orders.component.scss"],
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  pageIndex = 0;
  readonly pageSize = 10;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders || [];
      },
    });
  }

  get pagedOrders(): Order[] {
    return this.orders.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.orders.length;
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
}
