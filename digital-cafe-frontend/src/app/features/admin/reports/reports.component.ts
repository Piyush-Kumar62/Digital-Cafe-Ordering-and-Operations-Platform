import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AdminDashboard } from "@shared/models/dashboard.model";
import { User } from "@shared/models/auth.model";
import { Cafe } from "@shared/models/cafe.model";

@Component({
  selector: "app-reports",
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  dashboard: AdminDashboard | null = null;
  users: User[] = [];
  cafes: Cafe[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getAdminDashboard().subscribe((d) => (this.dashboard = d));
    this.apiService.getAllUsers(0, 500).subscribe((res) => (this.users = res.content || []));
    this.apiService.getAdminCafes(0, 500).subscribe((res) => (this.cafes = res.content || []));
  }

  exportSummary(): void {
    if (!this.dashboard) return;
    const d = this.dashboard;
    const rows = [
      ["Metric", "Value"],
      ["Total Users", String(d.totalUsers)],
      ["Active Users", String(d.activeUsers)],
      ["Inactive Users", String(d.inactiveUsers)],
      ["Total Cafes", String(d.totalCafes)],
      ["Total Bookings", String(d.totalBookings)],
      ["Total Orders", String(d.totalOrders)],
      ["Total Revenue", String(d.totalRevenue)],
      ["Today Revenue", String(d.todayRevenue)],
      ["This Month Revenue", String(d.thisMonthRevenue)],
    ];
    this.downloadCsv("admin-summary-report.csv", rows);
  }

  exportUsers(): void {
    const rows = [["Id", "Username", "Email", "Roles", "Active", "Status"]];
    this.users.forEach((u) =>
      rows.push([
        String(u.id),
        u.username || "",
        u.email || "",
        (u.roles || []).join("|"),
        String(!!u.isActive),
        u.registrationStatus || "",
      ]),
    );
    this.downloadCsv("admin-users-report.csv", rows);
  }

  exportCafes(): void {
    const rows = [["Id", "Name", "City", "State", "Owner", "Active"]];
    this.cafes.forEach((c: any) =>
      rows.push([
        String(c.id),
        c.name || "",
        c.city || "",
        c.state || "",
        c.ownerName || "",
        String(!!c.isActive),
      ]),
    );
    this.downloadCsv("admin-cafes-report.csv", rows);
  }

  private downloadCsv(fileName: string, rows: string[][]): void {
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
