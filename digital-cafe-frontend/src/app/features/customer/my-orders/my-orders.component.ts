import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Order } from "@shared/models/order.model";

@Component({
  selector: "app-my-orders",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss'],
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  pagedOrders: Order[] = [];
  page = 1;
  readonly pageSize = 8;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders || [];
        this.recomputePage();
      },
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.orders.length / this.pageSize));
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.recomputePage();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      this.recomputePage();
    }
  }

  private recomputePage(): void {
    const start = (this.page - 1) * this.pageSize;
    this.pagedOrders = this.orders.slice(start, start + this.pageSize);
  }
}
