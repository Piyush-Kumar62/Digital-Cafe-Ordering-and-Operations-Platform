import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AlertService } from "@core/services/alert.service";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  autoRefreshSeconds = 15;
  enableToasts = true;

  constructor(private alertService: AlertService) {}

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
    this.alertService.success("Admin settings saved.");
  }

  reset(): void {
    this.autoRefreshSeconds = 15;
    this.enableToasts = true;
    localStorage.setItem("admin_refresh_seconds", "15");
    localStorage.setItem("admin_enable_toasts", "true");
    this.alertService.success("Admin settings reset.");
  }
}


