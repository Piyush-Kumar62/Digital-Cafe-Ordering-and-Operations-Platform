import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Payment } from "@shared/models/payment.model";

@Component({
  selector: "app-my-payments",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page">
      <header>
        <h1>Payments</h1>
        <p>View payment history and transaction status.</p>
      </header>

      <div class="table-wrap" *ngIf="pagedPayments.length; else empty">
        <table>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Order</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of pagedPayments">
              <td>{{ payment.transactionId || ('Payment #' + payment.id) }}</td>
              <td>{{ payment.orderNumber || payment.orderId }}</td>
              <td>{{ payment.amount | currency:'INR' }}</td>
              <td><span class="status">{{ payment.status }}</span></td>
              <td>{{ payment.completedAt || payment.initiatedAt || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button (click)="prevPage()" [disabled]="page === 1">Previous</button>
        <span>Page {{ page }} / {{ totalPages }}</span>
        <button (click)="nextPage()" [disabled]="page === totalPages">Next</button>
      </div>

      <ng-template #empty>
        <div class="empty">No payments found.</div>
      </ng-template>
    </section>
  `,
  styles: [`
    .page { padding: 1rem; }
    header h1 { margin: 0; }
    header p { color: #64748b; margin: .4rem 0 1rem; }
    .table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
    table { width: 100%; border-collapse: collapse; min-width: 700px; }
    th, td { text-align: left; border-bottom: 1px solid #e2e8f0; padding: .7rem; }
    th { color: #475569; font-size: .78rem; text-transform: uppercase; }
    .status { font-size: .75rem; font-weight: 700; background: #e2e8f0; border-radius: 999px; padding: .2rem .5rem; }
    .pagination { margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: .8rem; }
    .pagination button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: .45rem .7rem; }
    .empty { background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 1rem; }
  `],
})
export class MyPaymentsComponent implements OnInit {
  payments: Payment[] = [];
  pagedPayments: Payment[] = [];
  page = 1;
  readonly pageSize = 10;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMyPayments().subscribe({
      next: (payments) => {
        this.payments = payments || [];
        this.recomputePage();
      },
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.payments.length / this.pageSize));
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
    this.pagedPayments = this.payments.slice(start, start + this.pageSize);
  }
}
