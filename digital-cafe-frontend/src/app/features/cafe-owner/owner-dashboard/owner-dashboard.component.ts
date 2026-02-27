import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/auth/auth.service';
import { AlertService } from '@core/services/alert.service';
import { CardComponent } from '@shared/components/card/card.component';
import { OwnerDashboard } from '@shared/models/dashboard.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

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

        <!-- Charts Section -->
        <div class="charts-grid">
          <app-card title="Revenue – Last 7 Days">
            <div class="chart-wrapper">
              <canvas #revenueChart></canvas>
            </div>
          </app-card>

          <app-card title="Order Status Overview">
            <div class="chart-wrapper">
              <canvas #statusChart></canvas>
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
          <button class="action-btn" routerLink="/cafe-owner/bookings">
            <span class="action-icon">📅</span>
            View Bookings
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
export class OwnerDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;

  dashboard: OwnerDashboard | null = null;
  loading = true;
  cafeId: number | null = null;

  private revenueChart: Chart | null = null;
  private statusChart: Chart | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user && user.cafeId) {
      this.cafeId = user.cafeId;
      this.loadDashboard();
    }
  }

  ngAfterViewInit(): void {
    // Charts are initialized after data loads
  }

  loadDashboard(): void {
    if (!this.cafeId) return;

    this.apiService.getOwnerDashboard(this.cafeId).subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (error) => {
        this.alertService.error('Dashboard Error', 'Unable to load owner dashboard.');
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    if (this.statusChart) {
      this.statusChart.destroy();
    }
  }

  private initializeCharts(): void {
    if (!this.dashboard) return;
    this.createRevenueChart();
    this.createStatusChart();
  }

  private createRevenueChart(): void {
    if (!this.revenueChartRef || !this.dashboard?.revenueData?.length) return;

    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.dashboard.revenueData.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const values = this.dashboard.revenueData.map((d) => d.revenue);

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (₹)',
          data: values,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (context) => `₹${(context.parsed.y || 0).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: {
              font: { size: 11 },
              callback: (value) => `₹${value}`,
            },
          },
        },
      },
    };

    this.revenueChart = new Chart(ctx, config);
  }

  private createStatusChart(): void {
    if (!this.statusChartRef || !this.dashboard?.orderStatusCounts) return;

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const statusData = this.dashboard.orderStatusCounts;
    const labels = Object.keys(statusData);
    const values = Object.values(statusData);

    if (values.every((v) => v === 0)) return;

    const colorMap: { [key: string]: string } = {
      PENDING: 'rgba(99, 102, 241, 0.8)',
      PREPARING: 'rgba(249, 115, 22, 0.8)',
      READY: 'rgba(34, 197, 94, 0.8)',
      SERVED: 'rgba(14, 165, 233, 0.8)',
      CANCELLED: 'rgba(239, 68, 68, 0.8)',
    };
    const colors = labels.map((l) => colorMap[l] || 'rgba(148, 163, 184, 0.8)');

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 14,
              font: { size: 12, family: "'Inter', sans-serif" },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${pct}%)`;
              },
            },
          },
        },
      },
    };

    this.statusChart = new Chart(ctx, config);
  }
}
