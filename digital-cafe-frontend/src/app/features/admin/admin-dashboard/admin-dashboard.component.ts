import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { CardComponent } from '@shared/components/card/card.component';
import { AdminDashboard } from '@shared/models/dashboard.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage the entire platform</p>
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
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <p class="stat-label">Total Users</p>
                <h2 class="stat-value">{{ dashboard.totalUsers }}</h2>
              </div>
            </div>
          </app-card>

          <app-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">🏪</div>
              <div class="stat-info">
                <p class="stat-label">Total Cafés</p>
                <h2 class="stat-value">{{ dashboard.totalCafes }}</h2>
              </div>
            </div>
          </app-card>

          <app-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">📦</div>
              <div class="stat-info">
                <p class="stat-label">Total Orders</p>
                <h2 class="stat-value">{{ dashboard.totalOrders }}</h2>
              </div>
            </div>
          </app-card>

          <app-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <p class="stat-label">Total Revenue</p>
                <h2 class="stat-value">\${{ dashboard.totalRevenue | number: '1.2-2' }}</h2>
              </div>
            </div>
          </app-card>
        </div>

        <!-- Recent Users -->
        <app-card title="Recent Users" class="recent-users-card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of dashboard.recentUsers">
                  <td>{{ user.username }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge badge-primary">{{ user.role }}</span>
                  </td>
                  <td>{{ user.createdAt | date: 'short' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </app-card>

        <!-- Quick Actions -->
        <div class="actions-grid">
          <app-card title="Quick Actions">
            <div class="action-buttons">
              <button class="action-btn" routerLink="/admin/cafes">
                <span class="action-icon">🏪</span>
                Manage Cafés
              </button>
              <button class="action-btn" routerLink="/admin/users">
                <span class="action-icon">👥</span>
                Manage Users
              </button>
              <button class="action-btn" routerLink="/admin/reports">
                <span class="action-icon">📊</span>
                View Reports
              </button>
            </div>
          </app-card>
        </div>
      </div>
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

        p {
          color: #6b7280;
        }
      }

      .loading-state {
        text-align: center;
        padding: 4rem 2rem;

        .spinner {
          width: 48px;
          height: 48px;
          border: 5px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem;
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        .stat-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .stat-icon {
          font-size: 3rem;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
      }

      .table-container {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;

        th {
          text-align: left;
          padding: 0.75rem;
          background-color: #f9fafb;
          color: #374151;
          font-weight: 600;
          font-size: 0.875rem;
          border-bottom: 2px solid #e5e7eb;
        }

        td {
          padding: 1rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          color: #4b5563;
        }

        tbody tr:hover {
          background-color: #f9fafb;
        }
      }

      .action-buttons {
        display: grid;
        gap: 1rem;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #f9fafb;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        color: #1f2937;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
          transform: translateY(-2px);
        }

        .action-icon {
          font-size: 1.5rem;
        }
      }

      @media (max-width: 768px) {
        .dashboard-container {
          padding: 1rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  dashboard: AdminDashboard | null = null;
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.apiService.getAdminDashboard().subscribe({
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
