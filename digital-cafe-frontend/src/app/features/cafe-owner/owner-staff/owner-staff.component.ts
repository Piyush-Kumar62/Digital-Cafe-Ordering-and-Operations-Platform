import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { User } from "@shared/models/auth.model";

@Component({
  selector: "app-owner-staff",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="owner-page">
      <header class="page-header">
        <h1>Staff Management</h1>
        <p>Create and manage chef/waiter accounts.</p>
      </header>

      <form class="card form-grid" (ngSubmit)="createStaff()">
        <select [(ngModel)]="role" name="role" required>
          <option value="CHEF">CHEF</option>
          <option value="WAITER">WAITER</option>
        </select>
        <input [(ngModel)]="firstName" name="firstName" placeholder="First name" required />
        <input [(ngModel)]="lastName" name="lastName" placeholder="Last name" required />
        <input [(ngModel)]="username" name="username" placeholder="Username" required />
        <input [(ngModel)]="email" name="email" type="email" placeholder="Email" required />
        <button type="submit">Create Account</button>
      </form>

      <div class="grid">
        <article class="card item" *ngFor="let s of staff">
          <div>
            <h3>{{ s.firstName || s.username }} {{ s.lastName || '' }}</h3>
            <p>{{ s.email }} • {{ (s.roles && s.roles[0]) || '-' }}</p>
          </div>
          <div class="actions">
            <span [class.ok]="s.isActive" [class.bad]="!s.isActive">
              {{ s.isActive ? 'Active' : 'Inactive' }}
            </span>
            <button *ngIf="s.isActive" (click)="setStatus(s, false)">Deactivate</button>
            <button *ngIf="!s.isActive" (click)="setStatus(s, true)">Activate</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .owner-page { padding: 1rem; color: #0f172a; }
    .page-header { margin-bottom: 1rem; }
    .page-header h1 { margin: 0; }
    .page-header p { margin: .35rem 0 0; color: #64748b; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: .9rem; box-shadow: 0 6px 18px rgba(2, 6, 23, .06); }
    .form-grid { display: grid; gap: .7rem; grid-template-columns: repeat(3, minmax(0,1fr)); margin-bottom: 1rem; }
    input, select, button { border: 1px solid #cbd5e1; border-radius: 10px; padding: .55rem .65rem; font: inherit; }
    button { background: #0ea5e9; color: #fff; border: 0; font-weight: 700; cursor: pointer; }
    .grid { display: grid; gap: .8rem; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: .8rem; }
    .item h3 { margin: 0; }
    .item p { margin: .2rem 0 0; color: #64748b; font-size: .9rem; }
    .actions { display: flex; align-items: center; gap: .45rem; }
    .actions span { font-size: .8rem; font-weight: 700; padding: .2rem .45rem; border-radius: 999px; }
    .actions .ok { background: #dcfce7; color: #166534; }
    .actions .bad { background: #fee2e2; color: #991b1b; }
    @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } .item { flex-direction: column; align-items: flex-start; } }
  `],
})
export class OwnerStaffComponent implements OnInit {
  cafeId: number | null = null;
  staff: User[] = [];
  role: "CHEF" | "WAITER" = "CHEF";
  firstName = "";
  lastName = "";
  username = "";
  email = "";

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.cafeId = this.authService.currentUserValue?.cafeId || null;
    this.loadStaff();
  }

  loadStaff(): void {
    if (!this.cafeId) return;
    this.apiService.getStaffByCafe(this.cafeId).subscribe({
      next: (staff) => this.staff = staff || [],
    });
  }

  createStaff(): void {
    if (!this.cafeId) return;
    const req = {
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
    };
    const action = this.role === "CHEF"
      ? this.apiService.createChef(this.cafeId, req)
      : this.apiService.createWaiter(this.cafeId, req);

    action.subscribe({
      next: () => {
        this.notificationService.success(`${this.role} account created.`);
        this.firstName = "";
        this.lastName = "";
        this.username = "";
        this.email = "";
        this.loadStaff();
      },
      error: () => this.notificationService.error(`Failed to create ${this.role}.`),
    });
  }

  setStatus(user: User, active: boolean): void {
    const action = active
      ? this.apiService.activateStaff(user.id)
      : this.apiService.deactivateStaff(user.id);
    action.subscribe({
      next: () => this.loadStaff(),
      error: () => this.notificationService.error("Failed to update staff status."),
    });
  }
}
