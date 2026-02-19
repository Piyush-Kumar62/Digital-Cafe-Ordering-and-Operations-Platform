import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { NotificationService } from "@core/services/notification.service";
import { User } from "@shared/models/auth.model";

@Component({
  selector: "app-user-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">User Management</h1>
          <p class="page-subtitle">
            Manage registered users, approvals, and role-based access
          </p>
        </div>
        <button class="refresh-btn" (click)="refresh()" [disabled]="loading">
          {{ loading ? "Refreshing..." : "Refresh" }}
        </button>
      </div>

      <div class="filter-card">
        <div class="filter-item">
          <label>Status</label>
          <select [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="ALL">All</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Role</label>
          <select [(ngModel)]="roleFilter" (change)="applyFilters()">
            <option value="ALL">All</option>
            <option value="ADMIN">Admin</option>
            <option value="CAFE_OWNER">Cafe Owner</option>
            <option value="CHEF">Chef</option>
            <option value="WAITER">Waiter</option>
            <option value="CUSTOMER">Customer</option>
          </select>
        </div>
        <div class="filter-item search">
          <label>Search</label>
          <input
            type="text"
            [(ngModel)]="searchText"
            (input)="applyFilters()"
            placeholder="Email or username"
          />
        </div>
      </div>

      <div class="content-card">
        <div class="table-wrapper" *ngIf="filteredUsers.length > 0; else emptyState">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Roles</th>
                <th>Email Verified</th>
                <th>Reset Required</th>
                <th>Status</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers">
                <td>
                  <div class="user-cell">
                    <div class="avatar">{{ getAvatar(user) }}</div>
                    <div>
                      <div class="name">{{ user.username }}</div>
                      <div class="email">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ (user.roles || []).join(", ") || "-" }}</td>
                <td>
                  <span [class.ok]="user.isEmailVerified" [class.bad]="!user.isEmailVerified">
                    {{ user.isEmailVerified ? "Yes" : "No" }}
                  </span>
                </td>
                <td>
                  <span [class.bad]="user.mustResetPassword" [class.ok]="!user.mustResetPassword">
                    {{ user.mustResetPassword ? "Yes" : "No" }}
                  </span>
                </td>
                <td>
                  <span class="badge" [class.pending]="getStatus(user) === 'PENDING_APPROVAL'" [class.approved]="getStatus(user) === 'APPROVED'" [class.rejected]="getStatus(user) === 'REJECTED'">
                    {{ getStatus(user) }}
                  </span>
                </td>
                <td>{{ user.isActive ? "Active" : "Inactive" }}</td>
                <td>
                  <div class="actions">
                    <button
                      *ngIf="getStatus(user) === 'PENDING_APPROVAL'"
                      class="approve"
                      (click)="approve(user)"
                    >
                      Approve
                    </button>
                    <button
                      *ngIf="getStatus(user) === 'PENDING_APPROVAL'"
                      class="reject"
                      (click)="reject(user)"
                    >
                      Reject
                    </button>
                    <button
                      *ngIf="getStatus(user) !== 'PENDING_APPROVAL' && user.isActive"
                      class="deactivate"
                      (click)="deactivate(user)"
                    >
                      Deactivate
                    </button>
                    <button
                      *ngIf="getStatus(user) !== 'PENDING_APPROVAL' && !user.isActive"
                      class="activate"
                      (click)="activate(user)"
                    >
                      Activate
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #emptyState>
          <div class="empty-state">
            <h2>No users found</h2>
            <p>Try changing filters or refresh data.</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .management-container {
        padding: 0;
        color: #111827;
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, #111827, #1f2937);
        border: 1px solid #374151;
        padding: 1.25rem 1.5rem;
        border-radius: 14px;
        margin-bottom: 1.25rem;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
      }

      .page-title {
        font-size: 2rem;
        font-weight: 700;
        color: #f9fafb;
        margin: 0 0 0.35rem 0;
        line-height: 1.2;
      }

      .page-subtitle {
        color: #cbd5e1;
        margin: 0;
        font-size: 0.95rem;
      }

      .refresh-btn {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #ffffff;
        border: 1px solid #60a5fa;
        border-radius: 10px;
        padding: 0.6rem 1rem;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .refresh-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
      }

      .refresh-btn:focus-visible {
        outline: 2px solid #93c5fd;
        outline-offset: 2px;
      }

      .refresh-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .filter-card {
        background: #111827;
        border: 1px solid #374151;
        padding: 1rem;
        border-radius: 14px;
        margin-bottom: 1rem;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .filter-item label {
        color: #e2e8f0;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .filter-item select,
      .filter-item input {
        width: 100%;
        border: 1px solid #4b5563;
        background: #1f2937;
        color: #f9fafb;
        border-radius: 10px;
        padding: 0.55rem 0.75rem;
        font-size: 0.9rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .filter-item select option {
        background: #111827;
        color: #f9fafb;
      }

      .filter-item input::placeholder {
        color: #94a3b8;
      }

      .filter-item select:focus,
      .filter-item input:focus {
        outline: none;
        border-color: #60a5fa;
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
      }

      .table-wrapper {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        color: #111827;
        padding: 0.8rem;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: middle;
      }

      th {
        color: #334155;
        font-weight: 700;
        font-size: 0.85rem;
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 0.8rem;
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        background: #e0e7ff;
        color: #3730a3;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }

      .name {
        font-weight: 600;
      }

      .email {
        font-size: 0.8rem;
        color: #6b7280;
      }

      .badge {
        border-radius: 999px;
        padding: 0.2rem 0.6rem;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .badge.pending {
        background: #fef3c7;
        color: #92400e;
      }

      .badge.approved {
        background: #dcfce7;
        color: #166534;
      }

      .badge.rejected {
        background: #fee2e2;
        color: #991b1b;
      }

      .ok {
        color: #15803d;
        font-weight: 600;
      }

      .bad {
        color: #b91c1c;
        font-weight: 600;
      }

      .actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }

      .actions button {
        border: none;
        border-radius: 6px;
        padding: 0.35rem 0.65rem;
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }

      .actions .approve,
      .actions .activate {
        background: #16a34a;
      }

      .actions .reject,
      .actions .deactivate {
        background: #dc2626;
      }

      .content-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        padding: 1rem;
        border-radius: 14px;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
      }

      .empty-state {
        text-align: center;
        padding: 2rem 1rem;
      }

      @media (max-width: 960px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.9rem;
        }

        .filter-card {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;

  statusFilter = "ALL";
  roleFilter = "ALL";
  searchText = "";

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
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
        this.notificationService.error(error?.message || "Failed to load users");
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

  approve(user: User): void {
    this.apiService.approveUser(user.id).subscribe({
      next: () => {
        this.notificationService.success("User approved successfully. Email sent.");
        this.refresh();
      },
      error: (error) => this.notificationService.error(error?.message || "Approve failed"),
    });
  }

  reject(user: User): void {
    this.apiService.rejectUser(user.id).subscribe({
      next: () => {
        this.notificationService.success("User rejected successfully. Email sent.");
        this.refresh();
      },
      error: (error) => this.notificationService.error(error?.message || "Reject failed"),
    });
  }

  activate(user: User): void {
    this.apiService.activateUser(user.id).subscribe({
      next: () => {
        this.notificationService.success("User activated.");
        this.refresh();
      },
      error: (error) => this.notificationService.error(error?.message || "Activate failed"),
    });
  }

  deactivate(user: User): void {
    this.apiService.deactivateUser(user.id).subscribe({
      next: () => {
        this.notificationService.success("User deactivated.");
        this.refresh();
      },
      error: (error) => this.notificationService.error(error?.message || "Deactivate failed"),
    });
  }

  getStatus(user: User): string {
    return user.registrationStatus || "APPROVED";
  }

  getAvatar(user: User): string {
    return (user.username || user.email || "U").charAt(0).toUpperCase();
  }
}



