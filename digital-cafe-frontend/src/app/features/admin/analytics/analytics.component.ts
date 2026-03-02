import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AdminDashboard } from "@shared/models/dashboard.model";

@Component({
  selector: "app-analytics",
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {
  dashboard: AdminDashboard | null = null;
  roleEntries: Array<[string, number]> = [];
  maxRoleCount = 1;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAdminDashboard().subscribe((d) => {
      this.dashboard = d;
      this.roleEntries = Object.entries(d.usersByRole || {}) as Array<[string, number]>;
      const counts = this.roleEntries.map((entry) => entry[1] || 0);
      this.maxRoleCount = Math.max(1, ...counts);
    });
  }

  getRoleWidth(value: number): string {
    const normalized = Math.max(0, Math.min(100, (value / this.maxRoleCount) * 100));
    return `${normalized}%`;
  }
}
