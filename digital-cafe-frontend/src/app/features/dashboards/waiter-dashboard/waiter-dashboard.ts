import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, WaiterDashboard } from '../../../core/services/dashboard.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-waiter-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiter-dashboard.html',
  styleUrl: './waiter-dashboard.css',
})
export class WaiterDashboardComponent implements OnInit {
  dashboard: WaiterDashboard | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  cafeId = 1; // This should come from the logged-in waiter's cafe

  constructor(
    private dashboardService: DashboardService,
    private orderService: OrderService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    // Get cafe ID from current user or default to 1
    const currentUser = this.authService.getCurrentUser();
    // In production, fetch cafeId from user profile
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getWaiterDashboard(this.cafeId).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load dashboard data';
        this.isLoading = false;
        console.error('Dashboard error:', error);
      },
    });
  }

  markServed(orderId: number) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.orderService.markServed(orderId, currentUser.id).subscribe({
      next: () => {
        this.successMessage = 'Order marked as served';
        this.loadDashboard();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to mark order as served';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  completeOrder(orderId: number) {
    this.orderService.completeOrder(orderId).subscribe({
      next: () => {
        this.successMessage = 'Order completed successfully';
        this.loadDashboard();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to complete order';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      READY: 'bg-success',
      SERVED: 'bg-info',
      COMPLETED: 'bg-secondary',
    };
    return statusMap[status] || 'bg-secondary';
  }

  getActionButtonText(status: string): string {
    if (status === 'READY') {
      return 'Mark Served';
    } else if (status === 'SERVED') {
      return 'Complete Order';
    }
    return 'No Action';
  }

  canTakeAction(status: string): boolean {
    return ['READY', 'SERVED'].includes(status);
  }

  handleOrderAction(order: any) {
    if (order.status === 'READY') {
      this.markServed(order.id);
    } else if (order.status === 'SERVED') {
      this.completeOrder(order.id);
    }
  }
}
