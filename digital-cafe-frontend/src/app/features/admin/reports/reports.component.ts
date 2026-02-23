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
  template: `
    <div class="container">
      <div class="actions">
        <button (click)="exportSummary()" [disabled]="!dashboard">Export Summary CSV</button>
        <button (click)="exportUsers()" [disabled]="!users.length">Export Users CSV</button>
        <button (click)="exportCafes()" [disabled]="!cafes.length">Export Cafes CSV</button>
      </div>

      <div class="card" *ngIf="dashboard as d">
        <h2>Current Summary Snapshot</h2>
        <div class="grid">
          <div class="metric-tile"><span>Total Users</span><strong>{{ d.totalUsers }}</strong></div>
          <div class="metric-tile"><span>Active Users</span><strong>{{ d.activeUsers }}</strong></div>
          <div class="metric-tile"><span>Total Cafes</span><strong>{{ d.totalCafes }}</strong></div>
          <div class="metric-tile"><span>Total Bookings</span><strong>{{ d.totalBookings }}</strong></div>
          <div class="metric-tile"><span>Total Orders</span><strong>{{ d.totalOrders }}</strong></div>
          <div class="metric-tile"><span>Total Revenue</span><strong>{{ d.totalRevenue }}</strong></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container { padding: 0; }
      .actions { display: flex; gap: 0.6rem; margin-bottom: 1rem; flex-wrap: wrap; }
      button { border: none; border-radius: 10px; padding: 0.5rem 0.85rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: transform 0.18s ease, box-shadow 0.18s ease; }
      button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(37, 99, 235, 0.3); }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      .card { background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border: 1px solid #dbe4f0; border-radius: 14px; padding: 1rem; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08); transition: transform 0.22s ease, box-shadow 0.22s ease; }
      .card:hover { transform: translateY(-2px); box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12); }
      .card h2 { margin: 0 0 0.8rem 0; font-size: 1rem; color: #0f172a; font-weight: 700; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; color: #334155; }
      .metric-tile { border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem 0.75rem; background: #ffffff; transition: border-color 0.2s ease, transform 0.2s ease; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
      .metric-tile span { font-weight: 600; color: #334155; }
      .metric-tile:hover { border-color: #c7d2fe; transform: translateY(-1px); }
      strong { color: #1d4ed8; }
      @media (max-width: 900px) {
        .actions { display: grid; grid-template-columns: 1fr; gap: 0.55rem; }
        button { width: 100%; }
      }
      @media (max-width: 760px) {
        .grid { grid-template-columns: 1fr; }
        .card { padding: 0.8rem; }
        .card h2 { font-size: 0.95rem; }
        .grid div { font-size: 0.88rem; padding: 0.6rem 0.65rem; }
      }
      @media (max-width: 480px) {
        .card { padding: 0.75rem; }
      }
    `,
  ],
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
