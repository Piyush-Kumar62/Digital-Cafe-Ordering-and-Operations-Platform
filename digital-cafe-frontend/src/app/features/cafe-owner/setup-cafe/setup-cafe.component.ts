import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AlertService } from "@core/services/alert.service";
import { environment } from "@environments/environment";

@Component({
  selector: "app-setup-cafe",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./setup-cafe.component.html",
  styleUrls: ["./setup-cafe.component.scss"],
})
export class SetupCafeComponent implements OnInit {
  cafeId: number | null = null;
  isEditMode = false;

  cafeForm!: FormGroup;

  selectedFile!: File | null;
  previewUrl: string | null = null;

  loading = false;
  successMessage = "";

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.cafeForm = this.fb.group({
      name: ["", [Validators.required, Validators.maxLength(100)]],
      description: ["", [Validators.maxLength(500)]],
      address: ["", [Validators.required, Validators.maxLength(300)]],
      city: ["", [Validators.required, Validators.maxLength(100)]],
      state: ["", [Validators.required, Validators.maxLength(100)]],
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

    this.route.queryParams.subscribe((params) => {
      if (params["id"]) {
        this.cafeId = +params["id"];
        this.isEditMode = true;
        this.loadCafeForEdit();
      }
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const twoMb = 2 * 1024 * 1024;
    if (file.size > twoMb) {
      this.alertService.error("Cafe image must be 2MB or less");
      event.target.value = "";
      return;
    }
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  loadCafeForEdit(): void {
    if (!this.cafeId) return;

    this.loading = true;

    this.apiService.getCafeById(this.cafeId).subscribe({
      next: (res: any) => {
        const cafe = res.data ? res.data : res;

        this.cafeForm.patchValue({
          name: cafe.name,
          description: cafe.description || "",
          address: cafe.address,
          city: cafe.city,
          state: cafe.state || "",
          landmark: cafe.landmark,
          phoneNumber: cafe.phoneNumber,
          pincode: cafe.pincode,
          openingTime: cafe.openTime,
          closingTime: cafe.closeTime,
          fssaiNumber: cafe.fssaiNumber,
          gstNumber: cafe.gstNumber,
          msmeNumber: cafe.msmeNumber,
        });

        if (cafe.logoUrl) {
          const base = environment.apiUrl.replace(/\/api$/, "");
          this.previewUrl = `${base}/api/cafes/${cafe.id}/logo`;
        }

        this.loading = false;
      },
      error: () => {
        this.alertService.error("Failed to load cafe");
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (this.cafeForm.invalid) {
      this.cafeForm.markAllAsTouched();
      this.alertService.error("Please fill all required fields correctly.");
      return;
    }

    const raw = this.cafeForm.value;
    const openingTime = this.normalizeTime(raw.openingTime);
    const closingTime = this.normalizeTime(raw.closingTime);
    const phoneNumber = this.normalizeDigits(raw.phoneNumber);
    const pincode = String(raw.pincode || "").trim();

    if (phoneNumber.length < 10 || phoneNumber.length > 20) {
      this.alertService.error("Phone number must be between 10 and 20 digits.");
      return;
    }

    if (raw.openingTime && !openingTime) {
      this.alertService.error("Opening time format is invalid.");
      return;
    }

    if (raw.closingTime && !closingTime) {
      this.alertService.error("Closing time format is invalid.");
      return;
    }

    const payload: any = {
      name: String(raw.name || "").trim(),
      description: String(raw.description || "").trim() || undefined,
      address: String(raw.address || "").trim(),
      city: String(raw.city || "").trim(),
      state: String(raw.state || "").trim() || undefined,
      phoneNumber,
      pincode,
    };

    if (openingTime) payload.openTime = openingTime;
    if (closingTime) payload.closeTime = closingTime;

    const optionalFields = ["fssaiNumber", "gstNumber", "msmeNumber"];
    optionalFields.forEach((field) => {
      const value = String(raw[field] || "").trim();
      if (value) payload[field] = value;
    });

    const formData = new FormData();

    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );

    if (this.selectedFile) {
      formData.append("logo", this.selectedFile);
    }

    this.loading = true;

    if (this.isEditMode && this.cafeId) {
      this.apiService.updateCafeSetup(this.cafeId, formData).subscribe({
        next: () => {
          this.alertService.success(
            "Cafe updated",
            "Cafe updated successfully",
          );
          this.router.navigate(["/owner/settings"]);
        },
        error: (err) => {
          this.alertService.error("Update failed", this.resolveApiError(err));
          this.loading = false;
        },
      });
    } else {
      this.apiService.createCafeSetup(formData).subscribe({
        next: () => {
          this.successMessage = "Café created successfully!";
          this.cafeForm.reset();
          this.previewUrl = null;

          setTimeout(() => {
            this.router.navigate(["/owner/settings"]);
          }, 500);
        },
        error: (err) => {
          this.alertService.error("Creation failed", this.resolveApiError(err));
          this.loading = false;
        },
      });
    }
  }

  private normalizeDigits(value: any): string {
    return String(value || "").replace(/\D/g, "");
  }

  private normalizeTime(value: any): string {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const hhmm = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (hhmm) {
      const h = Number(hhmm[1]);
      const m = Number(hhmm[2]);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }

    const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampm) {
      let h = Number(ampm[1]);
      const m = Number(ampm[2]);
      const meridian = ampm[3].toUpperCase();
      if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
        if (meridian === "PM" && h < 12) h += 12;
        if (meridian === "AM" && h === 12) h = 0;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      }
    }

    return "";
  }

  private resolveApiError(err?: any): string {
    const fieldErrors = err?.error?.errors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey) return fieldErrors[firstKey];
    }
    return (
      err?.error?.message ||
      err?.message ||
      "Please check your input and try again."
    );
  }
}
