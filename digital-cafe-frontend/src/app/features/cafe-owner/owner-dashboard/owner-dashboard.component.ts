import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/auth/auth.service';
import { CardComponent } from '@shared/components/card/card.component';
import { OwnerDashboard } from '@shared/models/dashboard.model';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Café Owner Dashboard</h1>
        <p *ngIf="dashboard">{{ dashboard.cafeName }}</p>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div *ngIf="!loading && dashboard" class="dashboard-content">
        <!-- Stats Grid -->
        <div class="stats-grid">
          <app-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">📦</div>
              <div class="stat-info">
                <p class="stat-label">Today's Orders</p>
                <h2 class="stat-value">{{ dashboard.todayOrders }}</h2>
              </div>
            </div>
          </app-card>

          <app-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <p class="stat-label">Today's Revenue</p>
                <h2 class="stat-value">\${{ dashboard.todayRevenue | number: '1.2-2' }}</h2>
              </div>
            </div>
          </app-card>

          <app-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <p class="stat-label">Today's Bookings</p>
                <h2 class="stat-value">{{ dashboard.todayBookings }}</h2>
              </div>
            </div>
          </app-card>

          <app-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">⏳</div>
              <div class="stat-info">
                <p class="stat-label">Pending Orders</p>
                <h2 class="stat-value">{{ dashboard.pendingOrders }}</h2>
              </div>
            </div>
          </app-card>
        </div>

        <!-- Popular Items -->
        <app-card title="Popular Items Today">
          <div class="popular-items">
            <div *ngFor="let item of dashboard.popularItems" class="popular-item">
              <div class="item-info">
                <span class="item-name">{{ item.menuItemName }}</span>
                <span class="item-count">{{ item.orderCount }} orders</span>
              </div>
              <div class="item-revenue">\${{ item.totalRevenue | number: '1.2-2' }}</div>
            </div>
          </div>
        </app-card>

        <!-- Quick Actions -->
        <div class="actions-grid">
          <button class="action-btn" routerLink="/cafe-owner/menu">
            <span class="action-icon">📋</span>
            Manage Menu
          </button>
          <button class="action-btn" routerLink="/cafe-owner/tables">
            <span class="action-icon">🪑</span>
            Manage Tables
          </button>
          <button class="action-btn" routerLink="/cafe-owner/staff">
            <span class="action-icon">👥</span>
            Manage Staff
          </button>
          <button class="action-btn" routerLink="/cafe-owner/orders">
            <span class="action-icon">📦</span>
            View Orders
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./owner-dashboard.component.scss'],
})
export class OwnerDashboardComponent implements OnInit {
  dashboard: OwnerDashboard | null = null;
  loading = true;
  cafeId: number | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user && user.cafeId) {
      this.cafeId = user.cafeId;
      this.loadDashboard();
    }
  }

  loadDashboard(): void {
    if (!this.cafeId) return;

    this.apiService.getOwnerDashboard(this.cafeId).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.loading = false;
      },
    });
  }
}
