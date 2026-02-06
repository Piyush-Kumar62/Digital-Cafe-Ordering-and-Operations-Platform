import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, ChefDashboard } from '../../../core/services/dashboard.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-chef-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chef-dashboard.html',
  styleUrl: './chef-dashboard.css',
})
export class ChefDashboardComponent implements OnInit {
  dashboard: ChefDashboard | null = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  cafeId = 1; // This should come from the logged-in chef's cafe

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

    this.dashboardService.getChefDashboard(this.cafeId).subscribe({
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

  startPreparing(orderId: number) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.orderService.startPreparing(orderId, currentUser.id).subscribe({
      next: () => {
        this.successMessage = 'Order preparation started';
        this.loadDashboard();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to start preparation';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  markReady(orderId: number) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.errorMessage = 'User not authenticated';
      return;
    }

    this.orderService.markReady(orderId, currentUser.id).subscribe({
      next: () => {
        this.successMessage = 'Order marked as ready';
        this.loadDashboard();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to mark order ready';
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      PLACED: 'bg-warning',
      CONFIRMED: 'bg-info',
      PREPARING: 'bg-primary',
      READY: 'bg-success',
    };
    return statusMap[status] || 'bg-secondary';
  }

  getActionButtonText(status: string): string {
    if (status === 'PLACED' || status === 'CONFIRMED') {
      return 'Start Preparing';
    } else if (status === 'PREPARING') {
      return 'Mark Ready';
    }
    return 'No Action';
  }

  canTakeAction(status: string): boolean {
    return ['PLACED', 'CONFIRMED', 'PREPARING'].includes(status);
  }

  handleOrderAction(order: any) {
    if (order.status === 'PLACED' || order.status === 'CONFIRMED') {
      this.startPreparing(order.id);
    } else if (order.status === 'PREPARING') {
      this.markReady(order.id);
    }
  }
}
