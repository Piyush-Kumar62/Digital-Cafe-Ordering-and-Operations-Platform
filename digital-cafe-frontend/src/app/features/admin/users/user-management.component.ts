import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { User } from "@shared/models/auth.model";

@Component({
  selector: "app-user-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./user-management.component.html",
  styleUrls: ["./user-management.component.scss"],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  statusFilter = "ALL";
  roleFilter = "ALL";
  searchText = "";

  pageIndex = 0;
  readonly pageSize = 10;

  get pagedUsers(): User[] {
    return this.filteredUsers.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.filteredUsers.length;
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
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.apiService.getAllUsers(0, 500).subscribe({
      next: (res) => {
        this.users = res.content || [];
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.alertService.error(error?.message || "Failed to load users");
      },
    });
  }

  applyFilters(): void {
    this.pageIndex = 0;
    const query = this.searchText.trim().toLowerCase();
    this.filteredUsers = this.users.filter((u) => {
      const status = this.getStatus(u);
      const normalizedRoles = (u.roles || []).map((r) =>
        (r || "").replace("ROLE_", ""),
      );
      const roleOk =
        this.roleFilter === "ALL" || normalizedRoles.includes(this.roleFilter);
      const statusOk =
        this.statusFilter === "ALL" || status === this.statusFilter;
      const textOk =
        !query ||
        (u.username || "").toLowerCase().includes(query) ||
        (u.email || "").toLowerCase().includes(query);
      return roleOk && statusOk && textOk;
    });
  }

  async approve(user: User): Promise<void> {
    const confirmed = await this.alertService.confirm(
      "Approve User",
      `Approve ${user.username}?`,
    );
    if (!confirmed) {
      return;
    }
    this.alertService.loading("Approving user. Please wait.");
    this.apiService.approveUser(user.id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success(
          "User Approved",
          "User approved successfully. Email sent.",
        );
        this.refresh();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error(
          "Approve Failed",
          error?.message || "Approve failed",
        );
      },
    });
  }

  async reject(user: User): Promise<void> {
    const confirmed = await this.alertService.confirm(
      "Reject User",
      `Reject ${user.username}?`,
    );
    if (!confirmed) {
      return;
    }
    this.alertService.loading("Rejecting user. Please wait.");
    this.apiService.rejectUser(user.id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success(
          "User Rejected",
          "User rejected successfully. Email sent.",
        );
        this.refresh();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error(
          "Reject Failed",
          error?.message || "Reject failed",
        );
      },
    });
  }

  async activate(user: User): Promise<void> {
    const confirmed = await this.alertService.confirm(
      "Activate User",
      `Activate ${user.username}?`,
    );
    if (!confirmed) {
      return;
    }
    this.alertService.loading("Activating user. Please wait.");
    this.apiService.activateUser(user.id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success("User Activated", "User activated.");
        this.refresh();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error(
          "Activation Failed",
          error?.message || "Activate failed",
        );
      },
    });
  }

  async deactivate(user: User): Promise<void> {
    const confirmed = await this.alertService.confirm(
      "Deactivate User",
      `Deactivate ${user.username}?`,
    );
    if (!confirmed) {
      return;
    }
    this.alertService.loading("Deactivating user. Please wait.");
    this.apiService.deactivateUser(user.id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success("User Deactivated", "User deactivated.");
        this.refresh();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error(
          "Deactivation Failed",
          error?.message || "Deactivate failed",
        );
      },
    });
  }

  getStatus(user: User): string {
    return user.registrationStatus || "APPROVED";
  }

  getAvatar(user: User): string {
    return (user.username || user.email || "U").charAt(0).toUpperCase();
  }
}
