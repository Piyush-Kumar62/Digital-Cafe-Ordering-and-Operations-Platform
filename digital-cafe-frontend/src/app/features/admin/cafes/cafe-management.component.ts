import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { Cafe } from "@shared/models/cafe.model";
import { uppercaseMeridiem } from "@core/utils/date-time-format.util";

@Component({
  selector: "app-cafe-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./cafe-management.component.html",
  styleUrls: ["./cafe-management.component.scss"],
})
export class CafeManagementComponent implements OnInit {
  cafes: Cafe[] = [];
  filteredCafes: Cafe[] = [];
  loading = false;
  searchText = "";

  pageIndex = 0;
  readonly pageSize = 10;

  get pagedCafes(): Cafe[] {
    return this.filteredCafes.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.filteredCafes.length;
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }
  get rangeStart(): number {
    return this.totalElements === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }
  get allPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
  }

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
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
        this.alertService.error(error?.message || "Failed to load cafes");
      },
    });
  }

  applyFilter(): void {
    this.pageIndex = 0;
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

  async toggleStatus(cafe: Cafe): Promise<void> {
    const action = cafe.isActive ? "Deactivate" : "Activate";
    const confirmed = await this.alertService.confirm(
      `${action} Cafe`,
      `Are you sure you want to ${action.toLowerCase()} "${cafe.name}"?`,
    );
    if (!confirmed) {
      return;
    }

    this.alertService.loading("Updating cafe status. Please wait.");
    this.apiService.toggleCafeStatus(cafe.id, !cafe.isActive).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success(
          "Cafe Status Updated",
          "Cafe status updated successfully.",
        );
        this.loadCafes();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error(
          "Status Update Failed",
          error?.message || "Status update failed",
        );
      },
    });
  }

  async deleteCafe(cafe: Cafe): Promise<void> {
    const ok = await this.alertService.confirm(
      "Delete Cafe",
      `Delete cafe "${cafe.name}"? This cannot be undone.`,
    );
    if (!ok) return;
    this.alertService.loading("Deleting cafe. Please wait.");
    this.apiService.deleteCafeByAdmin(cafe.id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success("Cafe Deleted", "Cafe deleted successfully.");
        this.loadCafes();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error(
          "Delete Failed",
          error?.message || "Delete failed",
        );
      },
    });
  }

  fmtDate(value?: string): string {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const formatted = d.toLocaleString("en-IN", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return uppercaseMeridiem(formatted);
  }

  ownerLabel(cafe: Cafe): string {
    if (cafe.ownerName && cafe.ownerName.trim()) return cafe.ownerName.trim();
    if (cafe.ownerId) return `Owner #${cafe.ownerId}`;
    return "Unassigned";
  }
}
