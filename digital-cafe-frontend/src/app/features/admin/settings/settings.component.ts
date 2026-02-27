import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NotificationService } from "@core/services/notification.service";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="card hero">
        <h2>Preferences</h2>
        <p>Customize admin experience and dashboard behavior.</p>
      </div>

      <div class="card">
        <label>Auto Refresh Interval (seconds)</label>
        <input type="number" min="5" max="120" [(ngModel)]="autoRefreshSeconds" />
      </div>

      <div class="card">
        <label class="toggle">
          <input type="checkbox" [(ngModel)]="enableToasts" />
          Enable toast notifications
        </label>
      </div>

      <div class="actions">
        <button (click)="save()">Save Settings</button>
        <button class="secondary" (click)="reset()">Reset Defaults</button>
      </div>
    </div>
  `,
  styles: [
    `
      .container { padding: 0; }
      .card { background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border: 1px solid #dbe4f0; border-radius: 14px; padding: 1rem; margin-bottom: 0.8rem; box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08); transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .card:hover { transform: translateY(-2px); box-shadow: 0 16px 30px rgba(15, 23, 42, 0.11); }
      .hero { background: linear-gradient(125deg, #0f172a 0%, #1e293b 62%, #1d4ed8 100%); border-color: #334155; color: #f8fafc; }
      .hero h2 { margin: 0; font-size: 1.05rem; font-weight: 700; }
      .hero p { margin: 0.35rem 0 0 0; color: #cbd5e1; font-size: 0.88rem; }
      label { display: block; color: #334155; margin-bottom: 0.45rem; font-weight: 700; }
      input[type="number"] { border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.5rem 0.65rem; width: 220px; color: #0f172a; }
      input[type="number"]:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.25); }
      .toggle { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0; }
      .actions { display: flex; gap: 0.6rem; }
      button { border: none; border-radius: 10px; padding: 0.5rem 0.82rem; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; cursor: pointer; font-weight: 600; transition: transform 0.18s ease, box-shadow 0.18s ease; }
      button:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(37, 99, 235, 0.3); }
      .secondary { background: linear-gradient(135deg, #475569, #334155); }
      @media (min-width: 900px) {
        .container { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; }
        .card { margin-bottom: 0; }
        .actions { grid-column: 1 / -1; justify-content: flex-end; }
      }
      @media (max-width: 760px) {
        .card { padding: 0.8rem; }
        input[type="number"] { width: 100%; max-width: 100%; }
        .actions { display: grid; grid-template-columns: 1fr; gap: 0.55rem; }
        .actions button { width: 100%; }
        .toggle { align-items: flex-start; line-height: 1.25; }
      }
      @media (max-width: 480px) {
        .card { padding: 0.75rem; }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  autoRefreshSeconds = 15;
  enableToasts = true;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    const savedRefresh = Number(localStorage.getItem("admin_refresh_seconds"));
    const savedToasts = localStorage.getItem("admin_enable_toasts");
    if (!Number.isNaN(savedRefresh) && savedRefresh > 0) this.autoRefreshSeconds = savedRefresh;
    if (savedToasts !== null) this.enableToasts = savedToasts === "true";
  }

  save(): void {
    const normalized = Math.max(5, Math.min(120, Number(this.autoRefreshSeconds) || 15));
    this.autoRefreshSeconds = normalized;
    localStorage.setItem("admin_refresh_seconds", String(normalized));
    localStorage.setItem("admin_enable_toasts", String(this.enableToasts));
    this.notificationService.success("Admin settings saved.");
  }

  reset(): void {
    this.autoRefreshSeconds = 15;
    this.enableToasts = true;
    localStorage.setItem("admin_refresh_seconds", "15");
    localStorage.setItem("admin_enable_toasts", "true");
    this.notificationService.success("Admin settings reset.");
  }
}
