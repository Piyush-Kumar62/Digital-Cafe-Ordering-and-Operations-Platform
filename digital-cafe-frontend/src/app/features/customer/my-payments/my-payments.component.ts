import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { uppercaseMeridiem } from "@core/utils/date-time-format.util";
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "@shared/models/payment.model";

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
  readonly dayFilterOptions = ["ALL_DAYS", "TODAY", "YESTERDAY"] as const;
  readonly periodFilterOptions = [
    "ALL_PERIODS",
    "THIS_WEEK",
    "LAST_WEEK",
    "THIS_MONTH",
  ] as const;
  selectedDayFilter: (typeof this.dayFilterOptions)[number] = "ALL_DAYS";
  selectedPeriodFilter: (typeof this.periodFilterOptions)[number] =
    "ALL_PERIODS";
  pageIndex = 0;
  readonly pageSize = 10;
  readonly PaymentStatus = PaymentStatus;
  readonly PaymentMethod = PaymentMethod;

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
    return this.filteredPayments.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }

  get filteredPayments(): Payment[] {
    return (this.payments || []).filter(
      (payment) =>
        this.matchesDayFilter(payment) && this.matchesPeriodFilter(payment),
    );
  }

  get totalElements(): number {
    return this.filteredPayments.length;
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

  get totalSpent(): number {
    return this.filteredPayments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  }

  get successCount(): number {
    return this.filteredPayments.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    ).length;
  }

  get failedCount(): number {
    return this.filteredPayments.filter(
      (p) => p.status === PaymentStatus.FAILED,
    ).length;
  }

  get pendingCount(): number {
    return this.filteredPayments.filter(
      (p) => p.status === PaymentStatus.PENDING,
    ).length;
  }

  onDayFilterChange(value: string): void {
    if (
      this.dayFilterOptions.includes(
        value as (typeof this.dayFilterOptions)[number],
      )
    ) {
      this.selectedDayFilter = value as (typeof this.dayFilterOptions)[number];
      this.pageIndex = 0;
    }
  }

  onPeriodFilterChange(value: string): void {
    if (
      this.periodFilterOptions.includes(
        value as (typeof this.periodFilterOptions)[number],
      )
    ) {
      this.selectedPeriodFilter =
        value as (typeof this.periodFilterOptions)[number];
      this.pageIndex = 0;
    }
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const cur = this.pageIndex;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages: number[] = [];
    for (let i = 0; i < total; i++) {
      if (i === 0 || i === total - 1 || Math.abs(i - cur) <= 1) pages.push(i);
      else if (pages[pages.length - 1] !== -1) pages.push(-1); // ellipsis sentinel
    }
    return pages;
  }

  methodIcon(method?: string): string {
    switch ((method || "").toUpperCase()) {
      case "UPI":
        return "account_balance_wallet";
      case "CARD":
        return "credit_card";
      case "NET_BANKING":
        return "account_balance";
      case "WALLET":
        return "wallet";
      case "CASH":
        return "payments";
      default:
        return "payment";
    }
  }
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
  }

  fmtDate(value?: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return uppercaseMeridiem(value);
    return uppercaseMeridiem(
      date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
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

  private getPaymentDate(payment: Payment): Date | null {
    const raw = payment?.completedAt || payment?.initiatedAt || "";
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) return null;
    return new Date(parsed);
  }

  private matchesDayFilter(payment: Payment): boolean {
    if (this.selectedDayFilter === "ALL_DAYS") return true;
    const paymentDate = this.getPaymentDate(payment);
    if (!paymentDate) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (this.selectedDayFilter === "TODAY") {
      return this.isSameDate(paymentDate, today);
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDate(paymentDate, yesterday);
  }

  private matchesPeriodFilter(payment: Payment): boolean {
    if (this.selectedPeriodFilter === "ALL_PERIODS") return true;
    const paymentDate = this.getPaymentDate(payment);
    if (!paymentDate) return false;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (this.selectedPeriodFilter === "THIS_MONTH") {
      return (
        paymentDate.getFullYear() === now.getFullYear() &&
        paymentDate.getMonth() === now.getMonth()
      );
    }

    const day = startOfToday.getDay();
    const offset = day === 0 ? 6 : day - 1;
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - offset);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    if (this.selectedPeriodFilter === "THIS_WEEK") {
      return paymentDate >= startOfThisWeek;
    }

    return paymentDate >= startOfLastWeek && paymentDate < startOfThisWeek;
  }

  private isSameDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
