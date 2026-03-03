import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { Cafe } from "@shared/models/cafe.model";
import { FEATURED_CAFE_SEED } from "@shared/data/featured-cafes.data";
import { environment } from "@environments/environment";

@Component({
  selector: "app-owner-cafes",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: "./owner-cafes.component.html",
  styleUrls: ["./owner-cafes.component.scss"],
})
export class OwnerCafesComponent implements OnInit {
  cafes: Cafe[] = [];
  editingCafe: Cafe | null = null;
  loading = true;

  get hasCafe(): boolean {
    return this.cafes.length > 0;
  }
  // Keep single `cafe` accessor for backward compat (first/primary cafe)
  get cafe(): Cafe | null {
    return this.cafes[0] || null;
  }

  // Seed cafes preview panel (same 6 shown on landing page)
  featuredSeed = FEATURED_CAFE_SEED;

  // Edit / Create form
  showForm = false;
  isEditMode = false;
  formLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  cafeForm!: FormGroup;
  expandedSeedId: number | null = null;

  // Quick-seed modal
  showSeedModal = false;
  seedLoading = false;
  seedIndex: number | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private alertService: AlertService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCafe();
  }

  private buildForm(): void {
    this.cafeForm = this.fb.group({
      name: ["", [Validators.required, Validators.maxLength(100)]],
      description: ["", [Validators.maxLength(500)]],
      address: ["", [Validators.required, Validators.maxLength(300)]],
      city: ["", [Validators.required, Validators.maxLength(100)]],
      state: ["", [Validators.maxLength(100)]],
      landmark: [""],
      phoneNumber: [
        "",
        [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,20}$/)],
      ],
      pincode: ["", [Validators.required, Validators.maxLength(10)]],
      openingTime: [""],
      closingTime: [""],
      fssaiNumber: [""],
      gstNumber: [""],
      msmeNumber: [""],
    });
  }

  loadCafe(): void {
    this.loading = true;
    this.apiService.getMyCafes().subscribe({
      next: (cafes) => {
        this.cafes = cafes || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.alertService.error("Failed to load your cafes.");
      },
    });
  }

  getCafeImage(cafe: Cafe): string {
    const src = cafe?.logoUrl || cafe?.imageUrl;
    if (src) {
      if (/^https?:\/\//.test(src)) return src;
      if (src.startsWith("/")) {
        const base = environment.apiUrl.replace(/\/api$/, "");
        return `${base}${src}`;
      }
      // Absolute filesystem path (legacy) — fall through to logo endpoint
    }
    const base = environment.apiUrl.replace(/\/api$/, "");
    return `${base}/api/cafes/${cafe.id}/logo`;
  }

  getCafeImageBySeedId(id: number): string {
    return (
      this.featuredSeed.find((s) => s.id === id)?.imageUrl ||
      "assets/cafe/cafe-interior-01.jpg"
    );
  }

  formatRating(cafe: Cafe | null): string {
    if (!cafe) return "–";
    const r = (cafe as any).rating;
    if (r == null) return "–";
    const n = parseFloat(r);
    return isNaN(n) ? "–" : n.toFixed(1);
  }

  // ======================== FORM HELPERS ========================

  openCreate(): void {
    this.isEditMode = false;
    this.cafeForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
    this.showForm = true;
    this.showSeedModal = false;
  }

  openEdit(cafe: Cafe): void {
    this.editingCafe = cafe;
    this.isEditMode = true;
    const c = cafe as any;
    this.cafeForm.patchValue({
      name: c.name,
      description: c.description,
      address: c.address,
      city: c.city,
      state: c.state,
      landmark: c.landmark,
      phoneNumber: c.phoneNumber,
      pincode: c.pincode || c.zipCode,
      openingTime: this.to24h(c.openingTime || c.openTime),
      closingTime: this.to24h(c.closingTime || c.closeTime),
      fssaiNumber: c.fssaiNumber,
      gstNumber: c.gstNumber,
      msmeNumber: c.msmeNumber,
    });
    if (c.imageUrl) {
      this.previewUrl = c.imageUrl;
    } else {
      const base = environment.apiUrl.replace(/\/api$/, "");
      this.previewUrl = `${base}/api/cafes/${c.id}/logo`;
    }
    this.showForm = true;
    this.showSeedModal = false;
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingCafe = null;
    this.cafeForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  submitForm(): void {
    if (this.cafeForm.invalid) {
      this.cafeForm.markAllAsTouched();
      this.alertService.error("Please fill all required fields correctly.");
      return;
    }

    const raw = this.cafeForm.value;
    const fd = new FormData();

    const data: Record<string, any> = {
      name: raw.name?.trim(),
      description: raw.description?.trim() || "",
      address: raw.address?.trim(),
      city: raw.city?.trim(),
      state: raw.state?.trim() || "",
      landmark: raw.landmark?.trim() || "",
      phoneNumber: this.normalizeDigits(raw.phoneNumber),
      pincode: String(raw.pincode || "").trim(),
      openTime: this.normalizeTime(raw.openingTime) || null,
      closeTime: this.normalizeTime(raw.closingTime) || null,
      fssaiNumber: raw.fssaiNumber?.trim() || "",
      gstNumber: raw.gstNumber?.trim() || "",
      msmeNumber: raw.msmeNumber?.trim() || "",
    };

    fd.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" }),
    );
    if (this.selectedFile) {
      fd.append("logo", this.selectedFile);
    }

    this.formLoading = true;
    const obs =
      this.isEditMode && this.editingCafe
        ? this.apiService.updateCafeSetup(this.editingCafe.id, fd)
        : this.apiService.createCafeSetup(fd);

    obs.subscribe({
      next: () => {
        this.alertService.success(
          this.isEditMode
            ? "Cafe updated successfully!"
            : "Cafe created successfully!",
        );
        this.formLoading = false;
        this.closeForm();
        this.loadCafe();
      },
      error: (err) => {
        this.formLoading = false;
        const msg =
          err?.error?.message ||
          (this.isEditMode ? "Update failed." : "Creation failed.");
        this.alertService.error(msg);
      },
    });
  }

  toggleStatus(cafe: Cafe): void {
    const newStatus = !(cafe as any).isActive;
    this.apiService.toggleCafeStatus(cafe.id, newStatus).subscribe({
      next: () => {
        this.alertService.success(
          `Cafe ${newStatus ? "activated" : "deactivated"} successfully!`,
        );
        this.loadCafe();
      },
      error: () => this.alertService.error("Failed to update cafe status."),
    });
  }

  // ======================== SEED QUICK-FILL ========================

  openSeedModal(): void {
    this.showSeedModal = true;
    this.showForm = false;
  }

  closeSeedModal(): void {
    this.showSeedModal = false;
    this.seedIndex = null;
  }

  prefillFromSeed(index: number): void {
    const seed = this.featuredSeed[index];
    if (!seed) return;
    this.isEditMode = false; // seeds always create a new cafe
    this.editingCafe = null;
    this.cafeForm.patchValue({
      name: seed.name,
      description: seed.description,
      address: seed.address,
      city: seed.city,
      state: seed.state,
      landmark: seed.landmark,
      phoneNumber: seed.phoneNumber,
      pincode: seed.pincode,
      openingTime: this.to24h(seed.openingTime),
      closingTime: this.to24h(seed.closingTime),
      fssaiNumber: seed.fssaiNumber,
    });
    this.previewUrl = seed.imageUrl;
    this.showSeedModal = false;
    this.showForm = true;
  }

  toggleSeedExpand(id: number): void {
    this.expandedSeedId = this.expandedSeedId === id ? null : id;
  }

  // ======================== UTILS ========================

  private normalizeDigits(val: string): string {
    return String(val || "").replace(/\D/g, "");
  }

  private normalizeTime(val: string): string {
    if (!val) return "";
    // If already HH:mm, return as-is
    if (/^\d{2}:\d{2}$/.test(val)) return val;
    // Try to parse 12h
    const m = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return val;
    let h = parseInt(m[1]);
    const mins = m[2];
    const ampm = m[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${mins}`;
  }

  private to24h(val: string): string {
    return this.normalizeTime(val || "");
  }

  formatTime(val: string | null | undefined): string {
    if (!val || val.trim() === "") return "";
    if (/AM|PM/i.test(val)) return val;
    const parts = val.split(":");
    if (parts.length < 2) return val;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return val;
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  get f() {
    return this.cafeForm.controls;
  }
}
