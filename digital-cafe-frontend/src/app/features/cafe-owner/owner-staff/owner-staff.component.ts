import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { CafeContextService } from "../services/cafe-context.service";
import { User } from "@shared/models/auth.model";
import { Subscription } from "rxjs";

@Component({
  selector: "app-owner-staff",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./owner-staff.component.html",
  styleUrls: ["./owner-staff.component.scss"],
})
export class OwnerStaffComponent implements OnInit, OnDestroy {
  cafeId: number | null = null;
  loading = false;

  staff: User[] = [];

  filteredStaff: User[] = [];

  pageIndex = 0;
  readonly pageSize = 10;

  get pagedStaff(): User[] {
    return this.filteredStaff.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.filteredStaff.length;
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

  searchText: string = "";
  selectedRole: string = "";
  selectedStatus: string = "";

  showModal = false;
  isEditMode = false;
  editingStaffId: number | null = null;

  role: "CHEF" | "WAITER" = "CHEF";
  username = "";
  email = "";

  firstName = "";
  lastName = "";
  phone = "";
  dob: string | null = null;
  gender = "MALE";

  govtIdType = "AADHAR";
  govtIdNumber = "";

  joiningDate: string | null = null;
  experienceYears: number | null = null;
  shift = "MORNING";
  private activeCafeSub?: Subscription;

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private cafeCtx: CafeContextService,
  ) {}

  ngOnInit(): void {
    this.activeCafeSub = this.cafeCtx.activeCafe$.subscribe((cafe) => {
      if (!cafe?.id || cafe.id === this.cafeId) {
        return;
      }
      this.cafeId = cafe.id;
      this.pageIndex = 0;
      this.loadStaff();
    });

    // If a specific cafeId is in the query params (multi-cafe owners), use it directly
    const queryId = this.route.snapshot.queryParamMap.get("cafeId");
    if (queryId) {
      this.cafeId = +queryId;
      this.loadStaff();
      return;
    }
    // Use context-selected cafe
    const activeCafe = this.cafeCtx.activeCafe;
    if (activeCafe) {
      this.cafeId = activeCafe.id;
      this.loadStaff();
      return;
    }
    this.loadMyCafe();
  }

  ngOnDestroy(): void {
    this.activeCafeSub?.unsubscribe();
  }

  private loadMyCafe(): void {
    this.apiService.getMyCafe().subscribe({
      next: (cafe) => {
        this.cafeId = cafe.id;
        this.loadStaff();
      },
      error: () => this.alertService.error("Unable to load cafe."),
    });
  }

  loadStaff(): void {
    if (!this.cafeId) return;
    this.loading = true;

    this.apiService.getStaffByCafe(this.cafeId).subscribe({
      next: (staff: User[]) => {
        this.staff = (staff || []).filter((user) => {
          const role = this.normalizeRole(user.roles?.[0]);
          return role === "CHEF" || role === "WAITER";
        });
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.alertService.error("Failed to load staff.");
      },
    });
  }

  applyFilters(): void {
    this.pageIndex = 0;
    const search = this.searchText.toLowerCase();

    this.filteredStaff = this.staff.filter((user) => {
      const role = this.normalizeRole(user.roles?.[0]);

      if (role !== "CHEF" && role !== "WAITER") return false;

      const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      const email = (user.email || "").toLowerCase();
      const status = user.isActive ? "ACTIVE" : "INACTIVE";

      const matchesSearch =
        !search || fullName.includes(search) || email.includes(search);

      const matchesRole = !this.selectedRole || role === this.selectedRole;

      const matchesStatus =
        !this.selectedStatus || status === this.selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  resetFilters(): void {
    this.searchText = "";
    this.selectedRole = "";
    this.selectedStatus = "";
    this.pageIndex = 0;
    this.filteredStaff = [...this.staff];
  }

  openAddStaff(): void {
    this.resetForm();
    this.showModal = true;
  }
  editStaff(user: User): void {
    this.isEditMode = true;
    this.showModal = true;
    this.editingStaffId = user.id;

    this.firstName = user.firstName || "";
    this.lastName = user.lastName || "";
    this.email = user.email || "";
    this.username = user.username || "";

    const role = user.roles?.[0] || "ROLE_CHEF";
    this.role = role.replace("ROLE_", "") as "CHEF" | "WAITER";

    this.joiningDate = user.joiningDate || null;
    this.experienceYears = user.experienceYears || null;
    this.shift = user.shift || "MORNING";

    this.govtIdType = user.govtIdType || "AADHAR";
    this.govtIdNumber = user.govtIdNumber || "";
  }
  submitStaff(): void {
    if (!this.cafeId) {
      this.alertService.error("Cafe not loaded. Please refresh and try again.");
      return;
    }

    const normalizedRole = this.normalizeRole(this.role) as "CHEF" | "WAITER";
    const normalizedEmail = this.normalizeEmail(this.email);
    const normalizedUsername = this.buildStaffUsername(
      this.username,
      normalizedEmail,
    );
    const normalizedFirstName = this.normalizeText(this.firstName);
    const normalizedLastName = this.normalizeText(this.lastName);

    if (normalizedRole !== "CHEF" && normalizedRole !== "WAITER") {
      this.alertService.error(
        "Invalid staff role. Allowed roles: CHEF, WAITER.",
      );
      return;
    }
    if (!normalizedEmail) {
      this.alertService.error("Email is required.");
      return;
    }
    if (!normalizedUsername || normalizedUsername.length < 3) {
      this.alertService.error("Username is required (minimum 3 characters).");
      return;
    }
    if (!normalizedFirstName) {
      this.alertService.error("First name is required.");
      return;
    }
    if (!normalizedLastName) {
      this.alertService.error("Last name is required.");
      return;
    }

    const payload = {
      role: normalizedRole,
      cafeId: this.cafeId,

      username: normalizedUsername,
      email: normalizedEmail,

      firstName: normalizedFirstName,
      lastName: normalizedLastName,

      govtIdType: this.normalizeText(this.govtIdType),
      govtIdNumber: this.normalizeText(this.govtIdNumber),

      joiningDate: this.joiningDate,
      experienceYears: this.experienceYears,
      shift: this.normalizeText(this.shift),
    };

    if (this.isEditMode && this.editingStaffId) {
      this.apiService.updateStaff(this.editingStaffId, payload).subscribe({
        next: () => {
          this.alertService.success("Staff updated successfully");
          this.closeModal();
          this.loadStaff();
        },
        error: (err) =>
          this.alertService.error(this.extractApiError(err, "Update failed")),
      });
    } else {
      this.apiService.createStaff(payload).subscribe({
        next: () => {
          this.alertService.success(
            `${normalizedRole} created. Welcome email sent.`,
          );
          this.closeModal();
          this.loadStaff();
        },
        error: (err) =>
          this.alertService.error(this.extractApiError(err, "Creation failed")),
      });
    }
  }

  setStatus(user: User, active: boolean): void {
    const action = active
      ? this.apiService.activateStaff(user.id)
      : this.apiService.deactivateStaff(user.id);

    action.subscribe(() => this.loadStaff());
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.username = "";
    this.email = "";
    this.firstName = "";
    this.lastName = "";
    this.phone = "";
    this.dob = null;
    this.gender = "MALE";
    this.govtIdType = "AADHAR";
    this.govtIdNumber = "";
    this.joiningDate = null;
    this.experienceYears = null;
    this.shift = "MORNING";
    this.role = "CHEF";
    this.isEditMode = false;
  }

  normalizeRole(role?: string): string {
    return String(role || "")
      .replace("ROLE_", "")
      .toUpperCase();
  }

  private normalizeText(value: string | null | undefined): string {
    return String(value || "").trim();
  }

  private normalizeEmail(value: string | null | undefined): string {
    return this.normalizeText(value).toLowerCase();
  }

  private buildStaffUsername(
    username: string | null | undefined,
    email: string,
  ): string {
    const direct = this.normalizeText(username);
    if (direct) return direct;
    if (!email) return "";
    return email.split("@")[0]?.trim() || "";
  }

  private extractApiError(error: any, fallback: string): string {
    const err = error?.error;
    if (err?.message) return err.message;
    if (err?.error) return err.error;
    if (err?.errors && typeof err.errors === "object") {
      const first = Object.values(err.errors)[0];
      if (typeof first === "string" && first.trim()) return first;
    }
    return fallback;
  }
}
