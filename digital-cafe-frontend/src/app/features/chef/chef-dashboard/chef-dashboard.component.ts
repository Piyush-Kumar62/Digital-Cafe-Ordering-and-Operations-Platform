import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/auth/auth.service';
import { WebSocketService } from '@core/websocket/websocket.service';
import { CardComponent } from '@shared/components/card/card.component';
import { Order, OrderStatus } from '@shared/models/order.model';
import { NotificationService } from '@core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chef-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Chef Dashboard</h1>
        <p>Manage kitchen operations</p>
      </div>

      <div class="stats-row">
        <div class="stat-box pending">
          <h3>{{ pendingOrders.length }}</h3>
          <p>Pending Orders</p>
        </div>
        <div class="stat-box preparing">
          <h3>{{ preparingOrders.length }}</h3>
          <p>Preparing</p>
        </div>
        <div class="stat-box ready">
          <h3>{{ readyOrders.length }}</h3>
          <p>Ready</p>
        </div>
      </div>

      <!-- Pending Orders -->
      <app-card title="Pending Orders" class="orders-section">
        <div *ngIf="pendingOrders.length === 0" class="empty-state">
          <p>No pending orders</p>
        </div>
        <div class="orders-grid">
          <div *ngFor="let order of pendingOrders" class="order-card pending">
            <div class="order-header">
              <h3>Order #{{ order.orderNumber }}</h3>
              <span class="badge badge-warning">{{ order.status }}</span>
            </div>
            <div class="order-details">
              <p><strong>Table:</strong> {{ order.tableNumber }}</p>
              <p><strong>Items:</strong></p>
              <ul class="items-list">
                <li *ngFor="let item of order.items">
                  {{ item.quantity }}x {{ item.menuItemName }}
                  <span *ngIf="item.specialInstructions" class="special-note"> ({{ item.specialInstructions }}) </span>
                </li>
              </ul>
            </div>
            <button class="btn-action btn-start" (click)="updateOrderStatus(order.id, 'PREPARING')">
              Start Preparing
            </button>
          </div>
        </div>
      </app-card>

      <!-- Preparing Orders -->
      <app-card title="Preparing" class="orders-section">
        <div *ngIf="preparingOrders.length === 0" class="empty-state">
          <p>No orders being prepared</p>
        </div>
        <div class="orders-grid">
          <div *ngFor="let order of preparingOrders" class="order-card preparing">
            <div class="order-header">
              <h3>Order #{{ order.orderNumber }}</h3>
              <span class="badge badge-info">{{ order.status }}</span>
            </div>
            <div class="order-details">
              <p><strong>Table:</strong> {{ order.tableNumber }}</p>
              <p><strong>Items:</strong></p>
              <ul class="items-list">
                <li *ngFor="let item of order.items">{{ item.quantity }}x {{ item.menuItemName }}</li>
              </ul>
            </div>
            <button class="btn-action btn-ready" (click)="updateOrderStatus(order.id, 'READY')">Mark as Ready</button>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .dashboard-header {
        margin-bottom: 2rem;

        h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
      }

      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-box {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
        border-left: 4px solid;

        &.pending {
          border-color: #f59e0b;
        }
        &.preparing {
          border-color: #3b82f6;
        }
        &.ready {
          border-color: #10b981;
        }

        h3 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        p {
          color: #6b7280;
          font-weight: 500;
        }
      }

      .orders-section {
        margin-bottom: 2rem;
      }

      .orders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
      }

      .order-card {
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        border-left: 4px solid;

        &.pending {
          border-left-color: #f59e0b;
        }
        &.preparing {
          border-left-color: #3b82f6;
        }
      }

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }
      }

      .order-details {
        margin-bottom: 1rem;

        p {
          margin: 0.5rem 0;
          color: #4b5563;
        }

        .items-list {
          margin: 0.5rem 0;
          padding-left: 1.25rem;
          color: #4b5563;

          li {
            margin: 0.25rem 0;
          }

          .special-note {
            color: #dc2626;
            font-style: italic;
            font-size: 0.875rem;
          }
        }
      }

      .btn-action {
        width: 100%;
        padding: 0.75rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;

        &.btn-start {
          background-color: #3b82f6;
          color: white;

          &:hover {
            background-color: #2563eb;
          }
        }

        &.btn-ready {
          background-color: #10b981;
          color: white;

          &:hover {
            background-color: #059669;
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
      }

      @media (max-width: 768px) {
        .dashboard-container {
          padding: 1rem;
        }

        .orders-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
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
    private notificationService: NotificationService,
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
    if (!this.cafeId) return;

    this.apiService.getOrdersByCafe(this.cafeId).subscribe({
      next: (orders) => {
        this.categorizeOrders(orders);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      },
    });
  }

  categorizeOrders(orders: Order[]): void {
    this.pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED);
    this.preparingOrders = orders.filter((o) => o.status === OrderStatus.PREPARING);
    this.readyOrders = orders.filter((o) => o.status === OrderStatus.READY);
  }

  subscribeToOrderUpdates(): void {
    this.webSocketService.orderNotifications$.pipe(takeUntil(this.destroy$)).subscribe((order) => {
      if (order) {
        this.notificationService.info(`New order received: #${order.orderNumber}`);
        this.loadOrders();
      }
    });
  }

  updateOrderStatus(orderId: number, status: string): void {
    this.apiService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.notificationService.success(`Order status updated to ${status}`);
        this.loadOrders();
      },
      error: (error) => {
        this.notificationService.error('Failed to update order status');
      },
    });
  }
}
