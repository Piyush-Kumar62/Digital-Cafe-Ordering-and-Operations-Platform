import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AdminDashboard } from "@shared/models/dashboard.model";

@Component({
  selector: "app-analytics",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" *ngIf="dashboard as d; else loadingTpl">
      <div class="grid">
        <div class="card users">
          <div class="card-top"><h3>Total Users</h3><span class="chip">USERS</span></div>
          <p>{{ d.totalUsers }}</p>
        </div>
        <div class="card cafes">
          <div class="card-top"><h3>Total Cafes</h3><span class="chip">CAFES</span></div>
          <p>{{ d.totalCafes }}</p>
        </div>
        <div class="card bookings">
          <div class="card-top"><h3>Total Bookings</h3><span class="chip">BOOKINGS</span></div>
          <p>{{ d.totalBookings }}</p>
        </div>
        <div class="card orders">
          <div class="card-top"><h3>Total Orders</h3><span class="chip">ORDERS</span></div>
          <p>{{ d.totalOrders }}</p>
        </div>
        <div class="card revenue-today">
          <div class="card-top"><h3>Today Revenue</h3><span class="chip">TODAY</span></div>
          <p>{{ d.todayRevenue }}</p>
        </div>
        <div class="card revenue-month">
          <div class="card-top"><h3>Month Revenue</h3><span class="chip">MONTH</span></div>
          <p>{{ d.thisMonthRevenue }}</p>
        </div>
      </div>

      <div class="split">
        <div class="panel">
          <h2>Users by Role</h2>
          <div *ngFor="let item of roleEntries" class="role-line">
            <div class="role-head">
              <span>{{ item[0] }}</span>
              <strong>{{ item[1] }}</strong>
            </div>
            <div class="role-bar">
              <span class="fill" [style.width]="getRoleWidth(item[1])"></span>
            </div>
          </div>
        </div>
        <div class="panel">
          <h2>Weekly Growth</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Users</th><th>Orders</th><th>Bookings</th><th>Revenue</th></tr></thead>
              <tbody>
                <tr *ngFor="let w of d.weeklyGrowth">
                  <td>{{ w.date }}</td>
                  <td>
                    <span class="metric-chip users-chip">{{ w.newUsers ?? w.usersCount ?? 0 }}</span>
                  </td>
                  <td>
                    <span class="metric-chip orders-chip">{{ w.newOrders ?? w.ordersCount ?? 0 }}</span>
                  </td>
                  <td>
                    <span class="metric-chip bookings-chip">{{ w.newBookings ?? w.bookingsCount ?? 0 }}</span>
                  </td>
                  <td>
                    <span class="metric-chip revenue-chip">{{ w.revenue ?? 0 }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <ng-template #loadingTpl><div class="container"><p class="loading-text">Loading analytics...</p></div></ng-template>
  `,
  styles: [
    `
      .container { padding: 0; }
      .loading-text { margin: 0; color: #334155; font-size: 0.95rem; font-weight: 600; }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.95rem;
        margin-bottom: 1.15rem;
      }
      .card {
        position: relative;
        overflow: hidden;
        background: linear-gradient(160deg, #ffffff 0%, #f8fafc 52%, #eff6ff 100%);
        border: 1px solid #dbe4f0;
        border-radius: 16px;
        padding: 0.95rem 0.95rem 1rem;
        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
        transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
        animation: riseIn 0.35s ease both;
      }
      .card::after {
        content: "";
        position: absolute;
        right: -22px;
        top: -22px;
        width: 98px;
        height: 98px;
        border-radius: 999px;
        opacity: 0.36;
        background: radial-gradient(circle at center, var(--card-glow, #2563eb) 0%, var(--card-glow-soft, rgba(37, 99, 235, 0.26)) 42%, transparent 72%);
        filter: blur(1px);
        transition: transform 0.22s ease, opacity 0.22s ease;
      }
      .card:hover {
        transform: translateY(-3px);
        border-color: color-mix(in srgb, var(--card-glow, #60a5fa) 36%, #dbe4f0);
        box-shadow: 0 20px 34px rgba(15, 23, 42, 0.16);
      }
      .card:hover::after {
        transform: scale(1.04);
        opacity: 0.48;
      }
      .card:nth-child(1) { animation-delay: 0.03s; }
      .card:nth-child(2) { animation-delay: 0.07s; }
      .card:nth-child(3) { animation-delay: 0.11s; }
      .card:nth-child(4) { animation-delay: 0.15s; }
      .card:nth-child(5) { animation-delay: 0.19s; }
      .card:nth-child(6) { animation-delay: 0.23s; }
      .card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
      }
      .card h3 {
        margin: 0 0 0.45rem 0;
        font-size: 0.82rem;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 700;
      }
      .card p {
        margin: 0;
        font-size: 1.58rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.1;
      }
      .chip {
        font-size: 0.67rem;
        line-height: 1;
        letter-spacing: 0.05em;
        font-weight: 700;
        border-radius: 999px;
        padding: 0.3rem 0.5rem;
        background: color-mix(in srgb, var(--card-glow, #60a5fa) 16%, #ffffff);
        color: #1e3a8a;
      }

      .users { --card-glow: #1d4ed8; --card-glow-soft: rgba(29, 78, 216, 0.45); }
      .cafes { --card-glow: #7c3aed; --card-glow-soft: rgba(124, 58, 237, 0.45); }
      .bookings { --card-glow: #0891b2; --card-glow-soft: rgba(8, 145, 178, 0.45); }
      .orders { --card-glow: #0f766e; --card-glow-soft: rgba(15, 118, 110, 0.45); }
      .revenue-today { --card-glow: #d97706; --card-glow-soft: rgba(217, 119, 6, 0.45); }
      .revenue-month { --card-glow: #15803d; --card-glow-soft: rgba(21, 128, 61, 0.45); }

      .split {
        display: grid;
        grid-template-columns: minmax(250px, 1fr) minmax(0, 2fr);
        gap: 0.95rem;
      }
      .panel {
        background: linear-gradient(160deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #dbe4f0;
        border-radius: 16px;
        padding: 0.95rem;
        box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
        transition: transform 0.22s ease, box-shadow 0.22s ease;
      }
      .panel:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
      }
      .panel h2 {
        margin: 0 0 0.7rem 0;
        font-size: 1rem;
        color: #0f172a;
        font-weight: 700;
      }
      .role-line {
        padding: 0.56rem 0;
        border-bottom: 1px solid #eef2f7;
      }
      .role-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .role-head span {
        color: #334155;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .role-head strong {
        color: #1d4ed8;
        font-size: 1rem;
        font-weight: 800;
      }
      .role-bar {
        margin-top: 0.45rem;
        height: 8px;
        border-radius: 999px;
        background: #e2e8f0;
        overflow: hidden;
      }
      .role-bar .fill {
        display: block;
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #2563eb, #06b6d4);
        transition: width 0.35s ease;
      }

      .table-wrap {
        overflow-x: auto;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 520px;
      }
      th, td {
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
        padding: 0.55rem 0.45rem;
        color: #0f172a;
        font-size: 0.9rem;
      }
      th {
        color: #475569;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 700;
      }
      tbody tr:hover {
        background: #f8fafc;
      }
      .metric-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        padding: 0.2rem 0.45rem;
        border-radius: 999px;
        font-size: 0.76rem;
        font-weight: 700;
      }
      .users-chip { background: #dbeafe; color: #1d4ed8; }
      .orders-chip { background: #dcfce7; color: #15803d; }
      .bookings-chip { background: #e0f2fe; color: #0369a1; }
      .revenue-chip { background: #fef3c7; color: #92400e; }

      @keyframes riseIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (max-width: 960px) {
        .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .split { grid-template-columns: 1fr; }
      }

      @media (max-width: 768px) {
        .grid { grid-template-columns: 1fr; }
        .card { padding: 0.8rem; }
        .card p { font-size: 1.25rem; }
        .panel { padding: 0.8rem; }
        .panel h2 { font-size: 0.95rem; }
        .role-head { gap: 0.5rem; }
        .role-head span, .role-head strong { font-size: 0.88rem; }
        table { min-width: 460px; }
        th, td { font-size: 0.82rem; padding: 0.48rem 0.42rem; }
      }

      @media (max-width: 480px) {
        .card p { font-size: 1.15rem; }
        table { min-width: 420px; }
      }
    `,
  ],
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
