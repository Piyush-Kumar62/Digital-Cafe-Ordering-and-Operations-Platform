import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { Payment } from "@shared/models/payment.model";

@Component({
  selector: "app-my-payments",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./my-payments.component.html",
  styleUrls: ["./my-payments.component.scss"],
})
export class MyPaymentsComponent implements OnInit {
  payments: Payment[] = [];
  loading = true;
  error = false;
  pageIndex = 0;
  readonly pageSize = 10;

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.apiService.getMyPayments().subscribe({
      next: (payments) => {
        this.payments = payments || [];
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  get pagedPayments(): Payment[] {
    return this.payments.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.payments.length;
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

  fmtDate(value?: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  downloadReceipt(payment: Payment): void {
    if (!payment?.id) {
      return;
    }
    this.apiService.downloadPaymentReceipt(payment.id).subscribe({
      next: (blob) => {
        const receiptNo = payment.transactionId || `payment-${payment.id}`;
        const fileName = `payment-receipt-${receiptNo}.pdf`;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.error = true;
        this.alertService.error("Failed to download receipt.");
      },
    });
  }

  resendReceiptEmail(payment: Payment): void {
    if (!payment?.id) {
      return;
    }
    this.apiService.resendPaymentReceiptEmail(payment.id).subscribe({
      next: () => {
        this.alertService.success("Receipt email sent successfully.");
      },
      error: () => {
        this.alertService.error("Failed to send receipt email.");
      },
    });
  }
}
