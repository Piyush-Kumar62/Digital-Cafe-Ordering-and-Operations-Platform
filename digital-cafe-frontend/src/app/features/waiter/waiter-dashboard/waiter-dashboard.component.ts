import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { Order } from "@shared/models/order.model";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "app-waiter-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./waiter-dashboard.component.html",
  styleUrls: ["./waiter-dashboard.component.scss"],
})
export class WaiterDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  readyOrders: Order[] = [];
  servedToday = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
    private webSocketService: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscribeRealtime();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async markServed(orderId: number): Promise<void> {
    const confirmed = await this.alertService.confirm("Confirm Service", "Mark this order as served?");
    if (!confirmed) {
      return;
    }

    this.alertService.loading("Updating order status. Please wait.");
    this.apiService.markOrderServed(orderId).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success("Order Served", "Order marked as served.");
        this.loadData();
      },
      error: () => {
        this.alertService.close();
        this.alertService.error("Update Failed", "Failed to update order status.");
      },
    });
  }

  private loadData(): void {
    this.loading = true;
    this.apiService.getReadyOrdersForWaiterWorkflow().subscribe({
      next: (orders) => {
        this.readyOrders = orders || [];
        this.servedToday = this.calculateServedToday(orders || []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private subscribeRealtime(): void {
    this.webSocketService.orderNotifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        if (notification) {
          this.loadData();
        }
      });
  }

  private calculateServedToday(orders: Order[]): number {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => {
      if (!o.servedAt) {
        return false;
      }
      return o.servedAt.slice(0, 10) === today;
    }).length;
  }
}


