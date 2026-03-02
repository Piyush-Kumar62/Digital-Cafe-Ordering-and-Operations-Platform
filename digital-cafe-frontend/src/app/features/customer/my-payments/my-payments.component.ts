import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Payment } from "@shared/models/payment.model";

@Component({
  selector: "app-my-payments",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.scss'],
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
