import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AdminDashboard } from "@shared/models/dashboard.model";
import { Chart, ChartConfiguration, registerables } from "chart.js";

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.scss"],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild("weeklyChart") weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("roleChart") roleChartRef!: ElementRef<HTMLCanvasElement>;

  dashboard: AdminDashboard | null = null;
  loading = true;
  weeklyChart: Chart | null = null;
  roleChart: Chart | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  loadDashboard(): void {
    this.loading = true;
    this.apiService.getAdminDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
        // Initialize charts after data is loaded
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (error) => {
        console.error("Error loading dashboard:", error);
        this.loading = false;
      },
    });
  }

  initializeCharts(): void {
    if (this.dashboard) {
      this.createWeeklyChart();
      this.createRoleChart();
    }
  }

  createWeeklyChart(): void {
    if (!this.weeklyChartRef || !this.dashboard?.weeklyGrowth) return;

    // Destroy existing chart if any
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }

    const ctx = this.weeklyChartRef.nativeElement.getContext("2d");
    if (!ctx) return;

    const labels = this.dashboard.weeklyGrowth.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    const config: ChartConfiguration = {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Users",
            data: this.dashboard.weeklyGrowth.map(
              (d) => d.usersCount || d.newUsers || 0,
            ),
            backgroundColor: "rgba(99, 102, 241, 0.8)",
            borderColor: "rgb(99, 102, 241)",
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: "Orders",
            data: this.dashboard.weeklyGrowth.map(
              (d) => d.ordersCount || d.newOrders || 0,
            ),
            backgroundColor: "rgba(34, 197, 94, 0.8)",
            borderColor: "rgb(34, 197, 94)",
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: "Bookings",
            data: this.dashboard.weeklyGrowth.map(
              (d) => d.bookingsCount || d.newBookings || 0,
            ),
            backgroundColor: "rgba(249, 115, 22, 0.8)",
            borderColor: "rgb(249, 115, 22)",
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                family: "'Inter', sans-serif",
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 13,
              weight: "bold",
            },
            bodyFont: {
              size: 12,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              font: {
                size: 11,
              },
            },
          },
        },
      },
    };

    this.weeklyChart = new Chart(ctx, config);
  }

  createRoleChart(): void {
    if (!this.roleChartRef || !this.dashboard?.usersByRole) return;

    // Destroy existing chart if any
    if (this.roleChart) {
      this.roleChart.destroy();
    }

    const ctx = this.roleChartRef.nativeElement.getContext("2d");
    if (!ctx) return;

    const roles = Object.keys(this.dashboard.usersByRole);
    const counts = Object.values(this.dashboard.usersByRole);

    const colors = [
      "rgba(99, 102, 241, 0.8)", // Indigo
      "rgba(34, 197, 94, 0.8)", // Green
      "rgba(249, 115, 22, 0.8)", // Orange
      "rgba(239, 68, 68, 0.8)", // Red
      "rgba(168, 85, 247, 0.8)", // Purple
      "rgba(236, 72, 153, 0.8)", // Pink
    ];

    const config: ChartConfiguration = {
      type: "doughnut",
      data: {
        labels: roles,
        datasets: [
          {
            data: counts,
            backgroundColor: colors,
            borderColor: "#ffffff",
            borderWidth: 3,
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                family: "'Inter', sans-serif",
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 13,
              weight: "bold",
            },
            bodyFont: {
              size: 12,
            },
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.parsed || 0;
                const total = (context.dataset.data as number[]).reduce(
                  (a, b) => a + b,
                  0,
                );
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    };

    this.roleChart = new Chart(ctx, config);
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      USER_REGISTRATION: "👤",
      CAFE_CREATED: "🏪",
      ORDER_PLACED: "📦",
      BOOKING_MADE: "📅",
      PAYMENT_RECEIVED: "💰",
      USER_LOGIN: "🔐",
      default: "📌",
    };
    return icons[type] || icons["default"];
  }

  getActivityIconClass(type: string): string {
    const classes: { [key: string]: string } = {
      USER_REGISTRATION: "bg-blue-500",
      CAFE_CREATED: "bg-indigo-500",
      ORDER_PLACED: "bg-green-500",
      BOOKING_MADE: "bg-amber-500",
      PAYMENT_RECEIVED: "bg-emerald-500",
      USER_LOGIN: "bg-blue-600",
      default: "bg-gray-500",
    };
    return classes[type] || classes["default"];
  }

  getRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  ngOnDestroy(): void {
    // Clean up charts on component destroy
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }
    if (this.roleChart) {
      this.roleChart.destroy();
    }
  }
}
