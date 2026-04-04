import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";
import {
  Subject,
  Subscription,
  catchError,
  of,
  switchMap,
  takeUntil,
  timer,
} from "rxjs";
import { Order, OrderStatus } from "@shared/models/order.model";
import { OrderTrackingService } from "./order-tracking.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";

const TERMINAL_STATUSES = new Set([OrderStatus.SERVED, OrderStatus.CANCELLED]);

@Component({
  selector: "app-order-tracking",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./order-tracking.component.html",
  styleUrls: ["./order-tracking.component.scss"],
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  recentOrders: Order[] = [];
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
  readonly pageSizeOptions = [10, 20, 50];
  pageSize = 10;
  currentPage = 1;
  sendingReceiptOrderIds = new Set<number>();
  downloadingReceiptOrderIds = new Set<number>();
  private paymentIdByOrderId = new Map<number, number>();
  loading = true;
  error = "";
  lastRefreshed: Date | null = null;
  private orderId: number | null = null;
  private pollSub?: Subscription;
  private destroy$ = new Subject<void>();
  orderStatusSteps: OrderStatus[] = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PLACED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.SERVED,
  ];
  OrderStatus = OrderStatus; // Expose enum to template

  constructor(
    private route: ActivatedRoute,
    private orderTrackingService: OrderTrackingService,
    private webSocketService: WebSocketService,
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = Number(params.get("id"));
      this.orderId = Number.isFinite(id) && id > 0 ? id : null;
      this.error = "";
      this.order = null;
      this.recentOrders = [];

      if (this.orderId) {
        this.startLiveTracking(this.orderId);
      } else {
        this.stopPolling();
        this.loadRecentOrders();
      }
    });

    this.webSocketService.orderNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: any) => {
        if (!this.orderId || !notification) {
          return;
        }
        if (
          notification.orderId === this.orderId ||
          notification.id === this.orderId
        ) {
          this.refreshCurrentOrder();
        }
      });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStepStatus(
    step: OrderStatus,
    currentStatus: OrderStatus,
  ): "completed" | "current" | "upcoming" {
    const currentIndex = this.orderStatusSteps.indexOf(currentStatus);
    const stepIndex = this.orderStatusSteps.indexOf(step);

    if (stepIndex < currentIndex) {
      return "completed";
    } else if (stepIndex === currentIndex) {
      return "current";
    } else {
      return "upcoming";
    }
  }

  getItemTotal(item: any): number {
    return item?.totalPrice ?? item?.subtotal ?? 0;
  }

  getStepIcon(step: OrderStatus): string {
    const icons: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING_PAYMENT]: "schedule",
      [OrderStatus.PLACED]: "receipt_long",
      [OrderStatus.PREPARING]: "restaurant",
      [OrderStatus.READY]: "notifications_active",
      [OrderStatus.SERVED]: "done_all",
      [OrderStatus.CANCELLED]: "cancel",
    };
    return icons[step] ?? "radio_button_unchecked";
  }

  getStepLabel(step: OrderStatus): string {
    const labels: Partial<Record<OrderStatus, string>> = {
      [OrderStatus.PENDING_PAYMENT]: "Pending Payment",
      [OrderStatus.PLACED]: "Placed",
      [OrderStatus.PREPARING]: "Preparing",
      [OrderStatus.READY]: "Ready",
      [OrderStatus.SERVED]: "Served",
      [OrderStatus.CANCELLED]: "Cancelled",
    };
    return labels[step] ?? step;
  }

  getStatusClass(status: OrderStatus): string {
    return "badge-" + status.toLowerCase().replace("_", "-");
  }

  formatStatus(status: string): string {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
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

  canDownloadReceipt(order: Order | null): boolean {
    return !!order?.id;
  }

  canEmailReceipt(order: Order | null): boolean {
    return !!order?.id;
  }

  isSendingReceiptEmail(orderId?: number): boolean {
    if (!orderId) {
      return false;
    }
    return this.sendingReceiptOrderIds.has(orderId);
  }

  isDownloadingReceipt(orderId?: number): boolean {
    if (!orderId) {
      return false;
    }
    return this.downloadingReceiptOrderIds.has(orderId);
  }

  onDayFilterChange(value: string): void {
    if (
      this.dayFilterOptions.includes(
        value as (typeof this.dayFilterOptions)[number],
      )
    ) {
      this.selectedDayFilter = value as (typeof this.dayFilterOptions)[number];
      this.currentPage = 1;
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
      this.currentPage = 1;
    }
  }

  onPageSizeChange(value: string): void {
    const size = Number(value);
    if (!Number.isFinite(size) || size <= 0) return;
    this.pageSize = size;
    this.currentPage = 1;
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  get filteredRecentOrders(): Order[] {
    const sorted = [...(this.recentOrders || [])].sort(
      (a, b) => this.getOrderTimestamp(b) - this.getOrderTimestamp(a),
    );
    return sorted.filter(
      (order) =>
        this.matchesDayFilter(order) && this.matchesPeriodFilter(order),
    );
  }

  get pagedRecentOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecentOrders.slice(start, start + this.pageSize);
  }

  get pageRangeStart(): number {
    if (this.filteredRecentOrders.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageRangeEnd(): number {
    if (this.filteredRecentOrders.length === 0) return 0;
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredRecentOrders.length,
    );
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredRecentOrders.length / this.pageSize),
    );
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const from = Math.max(1, current - 2);
    const to = Math.min(total, from + 4);
    for (let p = from; p <= to; p += 1) pages.push(p);
    return pages;
  }

  sendReceiptEmail(order: Order, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const orderId = order?.id;
    if (!orderId) {
      this.alertService.error("Receipt email is not available yet.");
      return;
    }
    if (this.sendingReceiptOrderIds.has(orderId)) {
      return;
    }

    this.sendingReceiptOrderIds.add(orderId);
    this.resolvePaymentId(order).subscribe({
      next: (paymentId) => {
        if (!paymentId) {
          this.alertService.error("Receipt email is not available yet.");
          this.sendingReceiptOrderIds.delete(orderId);
          return;
        }
        this.apiService.resendPaymentReceiptEmail(paymentId).subscribe({
          next: () => {
            this.alertService.success("Receipt sent to your email.");
            this.sendingReceiptOrderIds.delete(orderId);
          },
          error: () => {
            this.alertService.error("Failed to send receipt email.");
            this.sendingReceiptOrderIds.delete(orderId);
          },
        });
      },
      error: () => {
        this.alertService.error("Receipt email is not available yet.");
        this.sendingReceiptOrderIds.delete(orderId);
      },
    });
  }

  downloadReceipt(order: Order, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const orderId = order?.id;
    if (!orderId) {
      this.alertService.error("Payment receipt is not available yet.");
      return;
    }
    if (this.downloadingReceiptOrderIds.has(orderId)) {
      return;
    }

    this.downloadingReceiptOrderIds.add(orderId);
    this.resolvePaymentId(order).subscribe({
      next: (paymentId) => {
        if (!paymentId) {
          this.alertService.error("Payment receipt is not available yet.");
          this.downloadingReceiptOrderIds.delete(orderId);
          return;
        }
        this.apiService.downloadPaymentReceipt(paymentId).subscribe({
          next: (blob) => {
            const receiptNo =
              order.payment?.transactionId ||
              order.orderNumber ||
              `payment-${paymentId}`;
            const fileName = `payment-receipt-${receiptNo}.pdf`;
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = fileName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            this.downloadingReceiptOrderIds.delete(orderId);
          },
          error: () => {
            this.alertService.error("Failed to download receipt.");
            this.downloadingReceiptOrderIds.delete(orderId);
          },
        });
      },
      error: () => {
        this.alertService.error("Payment receipt is not available yet.");
        this.downloadingReceiptOrderIds.delete(orderId);
      },
    });
  }

  private startLiveTracking(orderId: number): void {
    this.loading = true;
    this.stopPolling();

    this.pollSub = timer(0, 5000)
      .pipe(
        switchMap(() =>
          this.orderTrackingService
            .getOrderById(orderId)
            .pipe(catchError(() => of(null))),
        ),
      )
      .subscribe((order) => {
        if (!order) {
          this.loading = false;
          if (!this.order) {
            this.error = "Unable to load this order right now.";
          }
          return;
        }
        this.order = order;
        this.loading = false;
        this.lastRefreshed = new Date();
        // Stop polling when order reaches a terminal state — no more updates expected
        if (TERMINAL_STATUSES.has(order.status)) {
          this.stopPolling();
        }
      });
  }

  private refreshCurrentOrder(): void {
    if (!this.orderId) {
      return;
    }
    this.orderTrackingService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
      },
    });
  }

  private loadRecentOrders(): void {
    this.loading = true;
    this.orderTrackingService.getMyOrders().subscribe({
      next: (orders) => {
        this.recentOrders = (orders || []).sort(
          (a, b) => this.getOrderTimestamp(b) - this.getOrderTimestamp(a),
        );
        this.currentPage = 1;
        this.loading = false;
      },
      error: () => {
        this.error = "Unable to load your orders.";
        this.loading = false;
      },
    });
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  private getOrderTimestamp(order: Order): number {
    const value = order?.placedAt || order?.updatedAt || order?.createdAt || "";
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private getOrderDate(order: Order): Date | null {
    const timestamp = this.getOrderTimestamp(order);
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private matchesDayFilter(order: Order): boolean {
    if (this.selectedDayFilter === "ALL_DAYS") return true;
    const orderDate = this.getOrderDate(order);
    if (!orderDate) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (this.selectedDayFilter === "TODAY") {
      return this.isSameDate(orderDate, today);
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDate(orderDate, yesterday);
  }

  private matchesPeriodFilter(order: Order): boolean {
    if (this.selectedPeriodFilter === "ALL_PERIODS") return true;
    const orderDate = this.getOrderDate(order);
    if (!orderDate) return false;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (this.selectedPeriodFilter === "THIS_MONTH") {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth()
      );
    }

    const day = startOfToday.getDay();
    const offset = day === 0 ? 6 : day - 1;
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - offset);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    if (this.selectedPeriodFilter === "THIS_WEEK") {
      return orderDate >= startOfThisWeek;
    }

    return orderDate >= startOfLastWeek && orderDate < startOfThisWeek;
  }

  private isSameDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private resolvePaymentId(order: Order) {
    const orderId = order?.id;
    if (!orderId) {
      return of<number | null>(null);
    }

    const nestedPaymentId = this.toNumericPaymentId(order?.payment);
    if (nestedPaymentId) {
      this.paymentIdByOrderId.set(orderId, nestedPaymentId);
      return of<number | null>(nestedPaymentId);
    }

    const cached = this.paymentIdByOrderId.get(orderId);
    if (cached) {
      return of<number | null>(cached);
    }

    return this.apiService.getPaymentByOrder(orderId).pipe(
      switchMap((payment: any) => {
        const resolved = this.toNumericPaymentId(payment);
        if (resolved) {
          this.paymentIdByOrderId.set(orderId, resolved);
        }
        return of<number | null>(resolved);
      }),
      catchError(() => of<number | null>(null)),
    );
  }

  private toNumericPaymentId(payment: any): number | null {
    const raw =
      payment?.paymentId ??
      payment?.id ??
      payment?.data?.paymentId ??
      payment?.data?.id;
    const numeric = Number(raw);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }
}
