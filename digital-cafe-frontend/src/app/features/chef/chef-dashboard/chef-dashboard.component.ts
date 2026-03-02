import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/auth/auth.service';
import { WebSocketService } from '@core/websocket/websocket.service';
import { CardComponent } from '@shared/components/card/card.component';
import { Order, OrderStatus } from '@shared/models/order.model';
import { AlertService } from '@core/services/alert.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chef-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './chef-dashboard.component.html',
  styleUrls: ['./chef-dashboard.component.scss'],
})
export class ChefDashboardComponent implements OnInit, OnDestroy {
  pendingOrders: Order[] = [];
  preparingOrders: Order[] = [];
  readyOrders: Order[] = [];
  cafeId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user && user.cafeId) {
      this.cafeId = user.cafeId;
      this.loadOrders();
      this.subscribeToOrderUpdates();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.apiService.getChefOrders().subscribe({
      next: (orders) => {
        this.categorizeOrders(orders);
      },
      error: (error) => {
        this.alertService.error('Load Failed', 'Unable to load kitchen orders.');
      },
    });
  }

  categorizeOrders(orders: Order[]): void {
    this.pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING);
    this.preparingOrders = orders.filter((o) => o.status === OrderStatus.PREPARING);
    this.readyOrders = orders.filter((o) => o.status === OrderStatus.READY);
  }

  subscribeToOrderUpdates(): void {
    this.webSocketService.orderNotifications$.pipe(takeUntil(this.destroy$)).subscribe((order) => {
      if (order) {
        this.alertService.info(`New order received: #${order.orderNumber}`);
        this.loadOrders();
      }
    });
  }

  updateOrderStatus(orderId: number, status: string): void {
    this.alertService.loading('Updating order status. Please wait.');
    const request$ = this.apiService.markOrderReady(orderId);

    request$.subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success('Status Updated', `Order status updated to ${status}.`);
        this.loadOrders();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error('Update Failed', 'Failed to update order status');
      },
    });
  }
}
