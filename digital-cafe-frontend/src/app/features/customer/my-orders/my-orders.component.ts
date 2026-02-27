import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Order } from "@shared/models/order.model";

@Component({
  selector: "app-my-orders",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page">
      <header>
        <h1>My Orders</h1>
        <p>Review your orders and jump to live tracking.</p>
      </header>

      <div class="list" *ngIf="pagedOrders.length; else empty">
        <article class="card" *ngFor="let order of pagedOrders">
          <div>
            <h3>{{ order.orderNumber || ('Order #' + order.id) }}</h3>
            <p>{{ order.items.length }} items • {{ order.totalAmount | currency:'INR' }}</p>
            <p>Status: <strong>{{ order.status }}</strong></p>
          </div>
          <a [routerLink]="['/customer/order-tracking', order.id]">Track</a>
        </article>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button (click)="prevPage()" [disabled]="page === 1">Previous</button>
        <span>Page {{ page }} / {{ totalPages }}</span>
        <button (click)="nextPage()" [disabled]="page === totalPages">Next</button>
      </div>

      <ng-template #empty>
        <div class="empty">
          No orders yet.
          <a routerLink="/customer/cafe">Browse cafes</a>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .page { padding: 1rem; }
    header h1 { margin: 0; }
    header p { color: #64748b; margin: .4rem 0 1rem; }
    .list { display: grid; gap: .8rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: .9rem; display: flex; align-items: center; justify-content: space-between; gap: .8rem; }
    .card h3 { margin: 0 0 .35rem; }
    .card p { margin: .2rem 0; color: #475569; }
    .card a { color: #2563eb; font-weight: 600; }
    .pagination { margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: .8rem; }
    .pagination button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: .45rem .7rem; }
    .empty { background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 1rem; }
    .empty a { margin-left: .5rem; color: #2563eb; }
    @media (max-width: 640px) { .card { flex-direction: column; align-items: flex-start; } }
  `],
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
