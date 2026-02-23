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

      <div class="owner-card">
        <div class="owner-create-header">
          <h3>Create Cafe Owner</h3>
          <p>
            Admin can create cafe owner accounts. Login credentials are emailed
            automatically.
          </p>
        </div>
        <div class="owner-create-grid">
          <div class="filter-item">
            <label for="ownerFirstName">First Name</label>
            <input
              id="ownerFirstName"
              type="text"
              [(ngModel)]="ownerFirstName"
              placeholder="Enter first name"
            />
          </div>
          <div class="filter-item">
            <label for="ownerLastName">Last Name</label>
            <input
              id="ownerLastName"
              type="text"
              [(ngModel)]="ownerLastName"
              placeholder="Enter last name"
            />
          </div>
          <div class="filter-item">
            <label for="ownerEmail">Email</label>
            <input
              id="ownerEmail"
              type="email"
              [(ngModel)]="ownerEmail"
              placeholder="owner@example.com"
            />
          </div>
          <div class="owner-create-action">
            <button
              class="create-owner-btn"
              (click)="createCafeOwner()"
              [disabled]="creatingOwner"
            >
              {{ creatingOwner ? "Creating..." : "Create Cafe Owner" }}
            </button>
          </div>
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
                <td><div class="roles">{{ (user.roles || []).join(", ") || "-" }}</div></td>
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
                  <div class="actions action-group">
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
            <p>Try changing filters and search criteria.</p>
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

      .filter-card {
        background: #ffffff;
        border: 1px solid #dbe4f0;
        padding: 1rem;
        border-radius: 14px;
        margin-bottom: 1rem;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .filter-card:focus-within,
      .filter-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);
      }

      .owner-card {
        background: #ffffff;
        border: 1px solid #dbe4f0;
        padding: 1rem;
        border-radius: 14px;
        margin-bottom: 1rem;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .owner-card:focus-within,
      .owner-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);
      }

      .owner-create-header {
        margin-bottom: 1rem;
      }

      .owner-create-header h3 {
        margin: 0 0 0.35rem 0;
        color: #0f172a;
        font-size: 1rem;
        font-weight: 700;
      }

      .owner-create-header p {
        margin: 0;
        color: #64748b;
        font-size: 0.83rem;
      }

      .owner-create-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1rem;
        align-items: end;
      }

      .owner-create-action {
        display: flex;
        align-items: flex-end;
      }

      .create-owner-btn {
        width: 100%;
        border: 1px solid #60a5fa;
        border-radius: 10px;
        padding: 0.55rem 0.75rem;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #ffffff;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .create-owner-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
      }

      .create-owner-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .filter-item label {
        color: #334155;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .filter-item select,
      .filter-item input {
        width: 100%;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
        border-radius: 10px;
        padding: 0.55rem 0.75rem;
        font-size: 0.9rem;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .filter-item select option {
        background: #ffffff;
        color: #0f172a;
      }

      .filter-item input::placeholder {
        color: #64748b;
      }

      .filter-item select:focus,
      .filter-item input:focus {
        outline: none;
        border-color: #60a5fa;
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
      }

      .table-wrapper {
        overflow-x: auto;
        border-radius: 12px;
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
      .roles {
        font-weight: 600;
        color: #334155;
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
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
        min-width: 0;
      }

      .actions button {
        border: none;
        border-radius: 8px;
        padding: 0.4rem 0.68rem;
        color: white;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
        white-space: nowrap;
        min-width: 84px;
      }
      .actions button:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 16px rgba(15, 23, 42, 0.14);
      }

      .actions .approve { background: linear-gradient(135deg, #0ea5e9, #0284c7) !important; }
      .actions .reject { background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important; }
      .actions .activate { background: linear-gradient(135deg, #16a34a, #15803d) !important; }
      .actions .deactivate { background: linear-gradient(135deg, #dc2626, #b91c1c) !important; }

      .content-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        padding: 1rem;
        border-radius: 14px;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .content-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 26px rgba(15, 23, 42, 0.1);
      }

      .empty-state {
        text-align: center;
        padding: 2rem 1rem;
      }

      @media (max-width: 960px) {
        .filter-card {
          grid-template-columns: 1fr;
        }

        .owner-create-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .action-group {
          display: flex;
          flex-direction: column;
          min-width: 120px;
        }

        .action-group button {
          width: 100%;
          justify-content: center;
        }
      }
    `,
  ],
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

  createCafeOwner(): void {
    const email = this.ownerEmail.trim();
    const firstName = this.ownerFirstName.trim();
    const lastName = this.ownerLastName.trim();

    if (!firstName || !lastName || !email) {
      this.notificationService.error(
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
        this.notificationService.success(
          "Cafe owner created successfully. Credentials sent via email.",
        );
        this.roleFilter = "CAFE_OWNER";
        this.refresh();
      },
      error: (error) => {
        this.creatingOwner = false;
        this.notificationService.error(
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



