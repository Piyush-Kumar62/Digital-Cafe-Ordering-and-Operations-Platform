import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { NotificationService } from "@core/services/notification.service";
import { Cafe } from "@shared/models/cafe.model";

@Component({
  selector: "app-cafe-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management-container">
      <div class="toolbar">
        <input
          type="text"
          [(ngModel)]="searchText"
          (input)="applyFilter()"
          placeholder="Search by cafe name, city, owner"
        />
        <span class="meta">Total: {{ filteredCafes.length }}</span>
      </div>

      <div class="card table-wrap" *ngIf="filteredCafes.length; else emptyState">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Location</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cafe of filteredCafes">
              <td>{{ cafe.name }}</td>
              <td>{{ cafe.ownerName || "-" }}</td>
              <td>{{ cafe.city }}, {{ cafe.state }}</td>
              <td>{{ cafe.email }}</td>
              <td>
                <span class="badge" [class.active]="cafe.isActive" [class.inactive]="!cafe.isActive">
                  {{ cafe.isActive ? "ACTIVE" : "INACTIVE" }}
                </span>
              </td>
              <td class="actions">
                <button class="btn-info" (click)="toggleStatus(cafe)">
                  {{ cafe.isActive ? "Deactivate" : "Activate" }}
                </button>
                <button class="btn-danger" (click)="deleteCafe(cafe)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #emptyState>
        <div class="card empty">No cafes found.</div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .management-container { padding: 0; }
      .toolbar { background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border: 1px solid #dbe4f0; border-radius: 14px; padding: 0.75rem; display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); }
      .toolbar input { flex: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.55rem 0.75rem; color: #0f172a; }
      .toolbar input:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.25); }
      .meta { color: #334155; font-size: 0.88rem; font-weight: 700; }
      .card { background: #ffffff; border: 1px solid #dbe4f0; border-radius: 14px; padding: 0.75rem; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .card:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(15, 23, 42, 0.1); }
      .empty { text-align: center; color: #64748b; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; border-bottom: 1px solid #e2e8f0; padding: 0.68rem; color: #0f172a; }
      th { color: #475569; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.04em; }
      tbody tr:hover { background: #f1f5f9; }
      .badge { border-radius: 999px; padding: 0.15rem 0.5rem; font-size: 0.72rem; font-weight: 700; }
      .badge.active { background: #dcfce7; color: #166534; }
      .badge.inactive { background: #fee2e2; color: #991b1b; }
      .actions { display: flex; gap: 0.4rem; }
      button { border: none; border-radius: 9px; padding: 0.4rem 0.62rem; color: #fff; font-size: 0.78rem; cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease; }
      button:hover { transform: translateY(-1px); }
      .btn-info { background: #0ea5e9; }
      .btn-danger { background: #dc2626; }
      @media (max-width: 760px) {
        .toolbar { flex-direction: column; align-items: stretch; }
        .meta { text-align: right; }
      }
    `,
  ],
})
export class CafeManagementComponent implements OnInit {
  cafes: Cafe[] = [];
  filteredCafes: Cafe[] = [];
  loading = false;
  searchText = "";

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadCafes();
  }

  loadCafes(): void {
    this.loading = true;
    this.apiService.getAdminCafes(0, 200).subscribe({
      next: (res) => {
        this.cafes = res.content || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.notificationService.error(error?.message || "Failed to load cafes");
      },
    });
  }

  applyFilter(): void {
    const q = this.searchText.trim().toLowerCase();
    this.filteredCafes = this.cafes.filter((c) => {
      if (!q) return true;
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.state || "").toLowerCase().includes(q) ||
        (c.ownerName || "").toLowerCase().includes(q)
      );
    });
  }

  toggleStatus(cafe: Cafe): void {
    this.apiService.toggleCafeStatus(cafe.id, !cafe.isActive).subscribe({
      next: () => {
        this.notificationService.success("Cafe status updated.");
        this.loadCafes();
      },
      error: (error) => this.notificationService.error(error?.message || "Status update failed"),
    });
  }

  async deleteCafe(cafe: Cafe): Promise<void> {
    const ok = await this.notificationService.confirm(
      "Delete Cafe",
      `Delete cafe "${cafe.name}"? This cannot be undone.`,
      "Delete",
      "Cancel",
    );
    if (!ok) return;
    this.apiService.deleteCafeByAdmin(cafe.id).subscribe({
      next: () => {
        this.notificationService.success("Cafe deleted.");
        this.loadCafes();
      },
      error: (error) => this.notificationService.error(error?.message || "Delete failed"),
    });
  }
}
