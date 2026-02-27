import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { NotificationService } from "@core/services/notification.service";
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

  // ORIGINAL DATA FROM BACKEND
  staff: User[] = [];

  // FILTERED DATA (DISPLAY THIS IN UI)
  filteredStaff: User[] = [];

  // 🔍 FILTER STATE
  searchText: string = "";
  selectedRole: string = "";
  selectedStatus: string = "";

  // Modal
  showModal = false;
  isEditMode = false;
  editingStaffId: number | null = null;

  // BASIC
  role: "CHEF" | "WAITER" = "CHEF";
  username = "";
  email = "";

  // PERSONAL
  firstName = "";
  lastName = "";
  phone = "";
  dob: string | null = null;
  gender = "MALE";

  // ID
  govtIdType = "AADHAR";
  govtIdNumber = "";

  // WORK
  joiningDate: string | null = null;
  experienceYears: number | null = null;
  shift = "MORNING";

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMyCafe();
  }

  private loadMyCafe(): void {
    this.apiService.getMyCafe().subscribe({
      next: (cafe) => {
        this.cafeId = cafe.id;
        this.loadStaff();
      },
      error: () => this.notificationService.error("Unable to load cafe.")
    });
  }

  loadStaff(): void {
    if (!this.cafeId) return;

    this.apiService.getStaffByCafe(this.cafeId).subscribe({
      next: (res: any) => {
        this.staff = res.data || [];
        this.filteredStaff = [...this.staff]; // initialize filtered list
      },
      error: () => this.notificationService.error("Failed to load staff.")
    });
  }

  // 🔎 APPLY FRONTEND FILTERS
 applyFilters(): void {

  const search = this.searchText.toLowerCase();

  this.filteredStaff = this.staff.filter(user => {

    const role = user.roles?.[0];

    // ✅ Only allow CHEF & WAITER in UI
    if (role !== "CHEF" && role !== "WAITER") return false;

    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const status = user.isActive ? "ACTIVE" : "INACTIVE";

    const matchesSearch =
      !search ||
      fullName.includes(search) ||
      email.includes(search);

    const matchesRole =
      !this.selectedRole || role === this.selectedRole;

    const matchesStatus =
      !this.selectedStatus || status === this.selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });
}

  // 🔄 RESET FILTERS
  resetFilters(): void {
    this.searchText = "";
    this.selectedRole = "";
    this.selectedStatus = "";
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

  // roles come like ["ROLE_CHEF"] → remove prefix
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
    shift: this.shift
  };

  console.log("Payload:", payload);

  // ✅ EDIT MODE → UPDATE
  if (this.isEditMode && this.editingStaffId) {
    this.apiService.updateStaff(this.editingStaffId, payload).subscribe({
      next: () => {
        this.notificationService.success("Staff updated successfully");
        this.closeModal();
        this.loadStaff();
      },
      error: () => this.notificationService.error("Update failed")
    });

  // ✅ CREATE MODE → CREATE
  } else {
    this.apiService.createStaff(payload).subscribe({
      next: () => {
        this.notificationService.success(`${this.role} created`);
        this.closeModal();
        this.loadStaff();
      },
      error: () => this.notificationService.error("Creation failed")
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
}