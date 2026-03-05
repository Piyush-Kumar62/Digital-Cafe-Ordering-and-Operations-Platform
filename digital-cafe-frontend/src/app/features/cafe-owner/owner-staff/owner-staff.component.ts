import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { User } from "@shared/models/auth.model";

@Component({
  selector: "app-owner-staff",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./owner-staff.component.html",
  styleUrls: ["./owner-staff.component.scss"],
})
export class OwnerStaffComponent implements OnInit {
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

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // If a specific cafeId is in the query params (multi-cafe owners), use it directly
    const queryId = this.route.snapshot.queryParamMap.get("cafeId");
    if (queryId) {
      this.cafeId = +queryId;
      this.loadStaff();
      return;
    }
    this.loadMyCafe();
  }

  private loadMyCafe(): void {
    this.apiService.cafeExistsForOwner().subscribe({
      next: (exists) => {
        if (!exists) {
          this.router.navigate(["/owner/setup"]);
          return;
        }

        this.apiService.getMyCafe().subscribe({
          next: (cafe) => {
            this.cafeId = cafe.id;
            this.loadStaff();
          },
          error: () => this.alertService.error("Unable to load cafe."),
        });
      },
      error: () => this.alertService.error("Unable to validate cafe status."),
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
    const payload = {
      role: this.role,
      cafeId: this.cafeId,

      username: this.username?.trim(),
      email: this.email?.trim(),

      firstName: this.firstName?.trim(),
      lastName: this.lastName?.trim(),

      govtIdType: this.govtIdType,
      govtIdNumber: this.govtIdNumber,

      joiningDate: this.joiningDate,
      experienceYears: this.experienceYears,
      shift: this.shift,
    };

    if (this.isEditMode && this.editingStaffId) {
      this.apiService.updateStaff(this.editingStaffId, payload).subscribe({
        next: () => {
          this.alertService.success("Staff updated successfully");
          this.closeModal();
          this.loadStaff();
        },
        error: () => this.alertService.error("Update failed"),
      });
    } else {
      this.apiService.createStaff(payload).subscribe({
        next: () => {
          this.alertService.success(`${this.role} created`);
          this.closeModal();
          this.loadStaff();
        },
        error: () => this.alertService.error("Creation failed"),
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
}
