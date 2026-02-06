import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DashboardService, AdminDashboard } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  dashboard: AdminDashboard | null = null;
  isLoading = true;
  errorMessage = '';

  // Weekly Growth Line Chart
  public weeklyGrowthChartData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [],
        label: 'New Registrations',
        fill: true,
        tension: 0.4,
        borderColor: 'rgb(206, 145, 78)',
        backgroundColor: 'rgba(206, 145, 78, 0.1)',
      },
    ],
  };

  public weeklyGrowthChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  public weeklyGrowthChartType: ChartType = 'line';

  // Users by Role Doughnut Chart
  public roleChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [
          'rgb(206, 145, 78)',
          'rgb(33, 150, 243)',
          'rgb(76, 175, 80)',
          'rgb(255, 152, 0)',
          'rgb(156, 39, 176)',
        ],
      },
    ],
  };

  public roleChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  public roleChartType: ChartType = 'doughnut';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getAdminDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.updateCharts();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load dashboard data';
        this.isLoading = false;
        console.error('Dashboard error:', error);
      },
    });
  }

  updateCharts() {
    if (!this.dashboard) return;

    // Update Weekly Growth Chart
    this.weeklyGrowthChartData.datasets[0].data = this.dashboard.weeklyGrowth;

    // Update Users by Role Chart
    this.roleChartData.labels = Object.keys(this.dashboard.usersByRole);
    this.roleChartData.datasets[0].data = Object.values(this.dashboard.usersByRole);
  }

  getProfileCompletionRate(): number {
    if (!this.dashboard || this.dashboard.totalUsers === 0) return 0;
    const completed = this.dashboard.totalUsers - this.dashboard.incompleteProfiles;
    return Math.round((completed / this.dashboard.totalUsers) * 100);
  }

  getEmailVerificationRate(): number {
    if (!this.dashboard || this.dashboard.totalUsers === 0) return 0;
    const verified = this.dashboard.totalUsers - this.dashboard.unverifiedEmails;
    return Math.round((verified / this.dashboard.totalUsers) * 100);
  }
}
