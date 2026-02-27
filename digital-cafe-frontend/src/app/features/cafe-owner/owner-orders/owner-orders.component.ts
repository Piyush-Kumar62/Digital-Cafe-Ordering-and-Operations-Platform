import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { Order } from "@shared/models/order.model";

@Component({
  selector: "app-owner-orders",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="owner-page">
      <header class="page-header">
        <h1>Order Overview</h1>
        <p>Monitor all orders in your cafe.</p>
      </header>

      <div class="stats">
        <article class="card"><small>Total</small><strong>{{ orders.length }}</strong></article>
        <article class="card"><small>Pending</small><strong>{{ countBy('PENDING') + countBy('PLACED') + countBy('CONFIRMED') }}</strong></article>
        <article class="card"><small>Preparing</small><strong>{{ countBy('PREPARING') }}</strong></article>
        <article class="card"><small>Ready/Served</small><strong>{{ countBy('READY') + countBy('SERVED') + countBy('COMPLETED') }}</strong></article>
      </div>

      <div class="grid">
        <article class="card item" *ngFor="let order of orders">
          <div>
            <h3>Order #{{ order.orderNumber || order.id }}</h3>
            <p>Table {{ order.tableNumber || order.tableId }} • {{ order.customerName || order.customerId }}</p>
            <p>{{ order.items.length }} items • {{ order.totalAmount | currency:'INR' }}</p>
          </div>
          <span class="status">{{ order.status }}</span>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .owner-page { padding: 1rem; color: #0f172a; }
    .page-header { margin-bottom: 1rem; }
    .page-header h1 { margin: 0; }
    .page-header p { margin: .35rem 0 0; color: #64748b; }
    .stats { display: grid; gap: .8rem; grid-template-columns: repeat(4, minmax(0,1fr)); margin-bottom: 1rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: .9rem; box-shadow: 0 6px 18px rgba(2, 6, 23, .06); }
    .stats small { color: #64748b; font-weight: 600; }
    .stats strong { display: block; margin-top: .2rem; font-size: 1.6rem; }
    .grid { display: grid; gap: .8rem; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: .8rem; }
    .item h3 { margin: 0; }
    .item p { margin: .25rem 0 0; color: #64748b; font-size: .9rem; }
    .status { font-size: .8rem; font-weight: 700; padding: .25rem .5rem; border-radius: 999px; background: #e0f2fe; color: #075985; }
    @media (max-width: 900px) { .stats { grid-template-columns: repeat(2, minmax(0,1fr)); } .item { flex-direction: column; align-items: flex-start; } }
    @media (max-width: 640px) { .stats { grid-template-columns: 1fr; } }
  `],
})
export class OwnerOrdersComponent implements OnInit {
  orders: Order[] = [];
  cafeId: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cafeId = this.authService.currentUserValue?.cafeId || null;
    if (!this.cafeId) return;
    this.apiService.getOrdersByCafe(this.cafeId).subscribe({
      next: (orders) => this.orders = orders || [],
    });
  }

  countBy(status: string): number {
    return this.orders.filter((o) => String(o.status) === status).length;
  }
}
