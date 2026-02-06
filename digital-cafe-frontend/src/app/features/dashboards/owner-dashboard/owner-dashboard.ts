import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { DashboardService, OwnerDashboard } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.css',
})
export class OwnerDashboardComponent implements OnInit {
  dashboard: OwnerDashboard | null = null;
  isLoading = true;
  errorMessage = '';

  // Revenue Chart
  public revenueChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Daily Revenue (₹)',
        fill: true,
        tension: 0.4,
        borderColor: 'rgb(206, 145, 78)',
        backgroundColor: 'rgba(206, 145, 78, 0.1)',
        pointBackgroundColor: 'rgb(206, 145, 78)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(206, 145, 78)',
      },
    ],
  };

  public revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed?.y || 0;
            return '₹' + value.toLocaleString();
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            return '₹' + value;
          },
        },
      },
    },
  };

  public revenueChartType: ChartType = 'line';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getOwnerDashboard().subscribe({
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

    // Update Revenue Chart
    this.revenueChartData.labels = this.dashboard.revenueChart.map((item) => item.date);
    this.revenueChartData.datasets[0].data = this.dashboard.revenueChart.map((item) =>
      Number(item.revenue),
    );
  }

  formatCurrency(amount: number): string {
    return (
      '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }
}
