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
  loading = true;
  error = "";
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
        this.recentOrders = (orders || [])
          .sort(
            (a, b) =>
              Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""),
          )
          .slice(0, 10);
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
}
