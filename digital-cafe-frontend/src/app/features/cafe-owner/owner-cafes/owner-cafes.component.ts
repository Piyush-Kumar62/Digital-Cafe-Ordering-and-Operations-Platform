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
import { of, switchMap } from "rxjs";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { uppercaseMeridiem } from "@core/utils/date-time-format.util";
import { CafeContextService } from "../services/cafe-context.service";
import { Cafe } from "@shared/models/cafe.model";
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
  pageIndex = 0;
  readonly pageSize = 20;
  editingCafe: Cafe | null = null;
  loading = true;
  readonly timeSlotOptions = this.buildTimeSlotOptions();

  get hasCafe(): boolean {
    return this.cafes.length > 0;
  }
  // Keep single `cafe` accessor for backward compat (first/primary cafe)
  get cafe(): Cafe | null {
    return this.cafes[0] || null;
  }

  get pagedCafes(): Cafe[] {
    const start = this.pageIndex * this.pageSize;
    return this.cafes.slice(start, start + this.pageSize);
  }

  get totalElements(): number {
    return this.cafes.length;
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

  // Quick-edit modal (owner's real cafés)
  showQuickEditModal = false;

  openQuickEditModal(): void {
    this.showQuickEditModal = true;
  }

  closeQuickEditModal(): void {
    this.showQuickEditModal = false;
  }

  selectCafeForEdit(cafe: Cafe): void {
    this.showQuickEditModal = false;
    this.openEdit(cafe);
  }

  // Edit / Create form
  showForm = false;
  isEditMode = false;
  formLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  galleryFiles: File[] = [];
  galleryPreviews: string[] = [];
  cafeForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private alertService: AlertService,
    private router: Router,
    private cafeCtx: CafeContextService,
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
        [
          Validators.required,
          Validators.pattern(/^[0-9]{10}$/),
          Validators.maxLength(10),
        ],
      ],
      pincode: ["", [Validators.required, Validators.maxLength(10)]],
      openingTime: [""],
      closingTime: [""],
      fssaiNumber: ["", [Validators.pattern(/^$|^[0-9]{14}$/)]],
      gstNumber: [
        "",
        [
          Validators.pattern(
            /^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
          ),
        ],
      ],
      msmeNumber: [
        "",
        [Validators.pattern(/^$|^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/)],
      ],
    });

    this.cafeForm.get("fssaiNumber")?.valueChanges.subscribe((value) => {
      const normalized = String(value || "")
        .replace(/\D/g, "")
        .slice(0, 14);
      if (normalized !== value) {
        this.cafeForm
          .get("fssaiNumber")
          ?.setValue(normalized, { emitEvent: false });
      }
    });

    this.cafeForm.get("gstNumber")?.valueChanges.subscribe((value) => {
      const normalized = String(value || "")
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, "")
        .slice(0, 15);
      if (normalized !== value) {
        this.cafeForm
          .get("gstNumber")
          ?.setValue(normalized, { emitEvent: false });
      }
    });

    this.cafeForm.get("msmeNumber")?.valueChanges.subscribe((value) => {
      const normalized = String(value || "")
        .toUpperCase()
        .replace(/[^0-9A-Z-]/g, "")
        .slice(0, 19);
      if (normalized !== value) {
        this.cafeForm
          .get("msmeNumber")
          ?.setValue(normalized, { emitEvent: false });
      }
    });
  }

  loadCafe(): void {
    this.loading = true;
    this.apiService.getMyCafes().subscribe({
      next: (cafes) => {
        this.cafes = cafes || [];
        if (this.pageIndex >= this.totalPages) {
          this.pageIndex = 0;
        }
        this.loading = false;
        // Refresh context with latest cafe list
        this.cafeCtx.loadCafes().subscribe();
      },
      error: () => {
        this.loading = false;
        this.alertService.error("Failed to load your cafes.");
      },
    });
  }

  /** Switch the active cafe in context and navigate to dashboard */
  setActiveCafe(cafe: Cafe): void {
    this.cafeCtx.setActiveCafe(cafe);
    this.router.navigate(["/owner/dashboard"]);
  }

  isActiveCafe(cafe: Cafe): boolean {
    return this.cafeCtx.activeCafe?.id === cafe.id;
  }

  getCafeImage(cafe: Cafe): string {
    const src = cafe?.logoUrl || cafe?.imageUrl;
    if (src) {
      if (/^https?:\/\//.test(src)) return src;
      if (src.startsWith("/")) {
        const base = environment.apiUrl.replace(/\/api$/, "");
        return `${base}${src}`;
      }
      // Absolute filesystem path or non-URL path (legacy) — use local fallback.
      if (/^[A-Za-z]:[/\\]/.test(src) || src.includes("\\")) {
        return "assets/cafe/cafe-interior-01.jpg";
      }
      return src;
    }
    return "assets/cafe/cafe-interior-01.jpg";
  }

  formatRating(cafe: Cafe | null): string {
    if (!cafe) return "–";
    const r = (cafe as any).rating;
    if (r == null) return "–";
    const n = parseFloat(r);
    return isNaN(n) ? "–" : n.toFixed(1);
  }

  // FORM HELPERS
  openCreate(): void {
    this.isEditMode = false;
    this.cafeForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
    this.galleryFiles = [];
    this.galleryPreviews = [];
    this.showForm = true;
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
    // Set previewUrl only when an image exists to avoid broken logo fallback requests.
    const rawImg = cafe.logoUrl || cafe.imageUrl;
    this.previewUrl = rawImg ? this.getCafeImage(cafe) : null;
    this.galleryFiles = [];
    this.galleryPreviews = Array.isArray(cafe.galleryImages)
      ? cafe.galleryImages.filter((img) => !!img)
      : [];
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingCafe = null;
    this.cafeForm.reset();
    this.selectedFile = null;
    this.previewUrl = null;
    this.galleryFiles = [];
    this.galleryPreviews = [];
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const twoMb = 2 * 1024 * 1024;
    if (file.size > twoMb) {
      this.alertService.error("Cafe image must be 2MB or less");
      input.value = "";
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  onGalleryChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files || []);
    if (!selected.length) return;

    const remaining = Math.max(0, 8 - this.galleryFiles.length);
    if (remaining === 0) {
      this.alertService.warning(
        "Gallery limit reached",
        "You can upload up to 8 gallery images.",
      );
      input.value = "";
      return;
    }

    selected.slice(0, remaining).forEach((file) => {
      if (!/^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.type)) {
        this.alertService.error(
          "Only JPG, PNG, WEBP, or GIF images are allowed.",
        );
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error("Each gallery image must be 5MB or less.");
        return;
      }
      this.galleryFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || "");
        if (src) this.galleryPreviews.push(src);
      };
      reader.readAsDataURL(file);
    });

    input.value = "";
  }

  removeGalleryImage(index: number): void {
    if (index < 0 || index >= this.galleryFiles.length) return;
    this.galleryFiles.splice(index, 1);
    this.galleryPreviews.splice(index, 1);
  }

  submitForm(): void {
    if (this.cafeForm.invalid) {
      this.cafeForm.markAllAsTouched();
      this.alertService.error("Please fill all required fields correctly.");
      return;
    }

    const raw = this.cafeForm.value;
    const normalizedFssai = String(raw.fssaiNumber || "")
      .replace(/\D/g, "")
      .slice(0, 14);
    const normalizedGst = String(raw.gstNumber || "")
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, "")
      .slice(0, 15);
    const normalizedMsme = String(raw.msmeNumber || "")
      .toUpperCase()
      .replace(/[^0-9A-Z-]/g, "")
      .slice(0, 19);

    if (normalizedFssai && !/^\d{14}$/.test(normalizedFssai)) {
      this.alertService.error("FSSAI number must be exactly 14 digits.");
      return;
    }
    if (
      normalizedGst &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(normalizedGst)
    ) {
      this.alertService.error("GST number must be a valid 15-character GSTIN.");
      return;
    }
    if (
      normalizedMsme &&
      !/^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/.test(normalizedMsme)
    ) {
      this.alertService.error(
        "MSME number must be in UDYAM-XX-00-0000000 format.",
      );
      return;
    }

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
      fssaiNumber: normalizedFssai || "",
      gstNumber: normalizedGst || "",
      msmeNumber: normalizedMsme || "",
    };

    if (String(data["phoneNumber"] || "").length !== 10) {
      this.alertService.error("Phone number must be exactly 10 digits.");
      return;
    }

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

    obs
      .pipe(
        switchMap((res: any) => {
          const cafeId =
            this.isEditMode && this.editingCafe
              ? this.editingCafe.id
              : Number(res?.id || res?.data?.id || 0);
          if (!this.galleryFiles.length || !cafeId) {
            return of(null);
          }
          const galleryFd = new FormData();
          this.galleryFiles.forEach((file) => galleryFd.append("files", file));
          return this.apiService.uploadGallery(cafeId, galleryFd);
        }),
      )
      .subscribe({
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

  // UTILS
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
    if (/AM|PM/i.test(val)) return uppercaseMeridiem(val);
    const parts = val.split(":");
    if (parts.length < 2) return val;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return val;
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  private buildTimeSlotOptions(): Array<{ label: string; value: string }> {
    const slots: Array<{ label: string; value: string }> = [];
    for (let hour = 0; hour < 24; hour++) {
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const period = hour < 12 ? "AM" : "PM";
      slots.push({
        value: `${String(hour).padStart(2, "0")}:00`,
        label: `${displayHour}:00 ${period}`,
      });
    }
    return slots;
  }

  get f() {
    return this.cafeForm.controls;
  }
}
