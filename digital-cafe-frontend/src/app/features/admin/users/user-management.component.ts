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
  creatingOwner = false;

  statusFilter = "ALL";
  roleFilter = "ALL";
  searchText = "";
  ownerFirstName = "";
  ownerLastName = "";
  ownerEmail = "";

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

  createCafeOwner(): void {
    const email = this.ownerEmail.trim();
    const firstName = this.ownerFirstName.trim();
    const lastName = this.ownerLastName.trim();

    if (!firstName || !lastName || !email) {
      this.alertService.error(
        "First name, last name, and email are required to create a cafe owner.",
      );
      return;
    }

    this.creatingOwner = true;
    this.apiService.createCafeOwner({
      firstName,
      lastName,
      email,
    }).subscribe({
      next: () => {
        this.creatingOwner = false;
        this.ownerFirstName = "";
        this.ownerLastName = "";
        this.ownerEmail = "";
        this.alertService.success(
          "Cafe owner created successfully. Credentials sent via email.",
        );
        this.roleFilter = "CAFE_OWNER";
        this.refresh();
      },
      error: (error) => {
        this.creatingOwner = false;
        this.alertService.error(
          error?.message || "Failed to create cafe owner",
        );
      },
    });
  }

  applyFilters(): void {
    const query = this.searchText.trim().toLowerCase();
    this.filteredUsers = this.users.filter((u) => {
      const status = this.getStatus(u);
      const normalizedRoles = (u.roles || []).map((r) =>
        (r || "").replace("ROLE_", ""),
      );
      const roleOk =
        this.roleFilter === "ALL" || normalizedRoles.includes(this.roleFilter);
      const statusOk = this.statusFilter === "ALL" || status === this.statusFilter;
      const textOk =
        !query ||
        (u.username || "").toLowerCase().includes(query) ||
        (u.email || "").toLowerCase().includes(query);
      return roleOk && statusOk && textOk;
    });
  }

  async approve(user: User): Promise<void> {
    const confirmed = await this.alertService.confirm("Approve User", `Approve ${user.username}?`);
    if (!confirmed) {
      return;
    }
    this.alertService.loading("Approving user. Please wait.");
    this.apiService.approveUser(user.id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success("User Approved", "User approved successfully. Email sent.");
        this.refresh();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error("Approve Failed", error?.message || "Approve failed");
      },
    });
  }

  async reject(user: User): Promise<void> {
    const confirmed = await this.alertService.confirm("Reject User", `Reject ${user.username}?`);
    if (!confirmed) {
      return;
    }
    this.alertService.loading("Rejecting user. Please wait.");
    this.apiService.rejectUser(user.id).subscribe({
      next: () => {
        this.alertService.close();
        this.alertService.success("User Rejected", "User rejected successfully. Email sent.");
        this.refresh();
      },
      error: (error) => {
        this.alertService.close();
        this.alertService.error("Reject Failed", error?.message || "Reject failed");
      },
    });
  }

  async activate(user: User): Promise<void> {
    const confirmed = await this.alertService.confirm("Activate User", `Activate ${user.username}?`);
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
        this.alertService.error("Activation Failed", error?.message || "Activate failed");
      },
    });
  }

  async deactivate(user: User): Promise<void> {
    const confirmed = await this.alertService.confirm("Deactivate User", `Deactivate ${user.username}?`);
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
        this.alertService.error("Deactivation Failed", error?.message || "Deactivate failed");
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





