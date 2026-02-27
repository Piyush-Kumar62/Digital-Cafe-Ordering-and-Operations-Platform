import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

import { ApiService } from "@core/services/api.service";
import { NotificationService } from "@core/services/notification.service";

@Component({
  selector: "app-owner-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./owner-settings.component.html",
  styleUrls: ["./owner-settings.component.scss"],
})
export class OwnerSettingsComponent implements OnInit {

  cafe: any = {};
  showViewModal = false;
  loading = true;
logoUrl: string = '';
coverUrl: string = '';

  // FILE STATE
  selectedLogoFile: File | null = null;
  selectedCoverFile: File | null = null;
  selectedGalleryFiles: File[] = [];

  // PREVIEWS
  logoPreview: string | null = null;
  coverPreview: string | null = null;
  galleryPreview: string[] = [];

  mapUrl: SafeResourceUrl | null = null;

  constructor(
    private apiService: ApiService,
    private notification: NotificationService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    this.loadCafe();
  }

  // ================= VIEW MODAL =================
openView(): void {
  this.showViewModal = true;
}

closeView(): void {
  this.showViewModal = false;
}

  // ================= LOAD CAFE =================
 loadCafe(): void {
  this.loading = true;

  this.apiService.getMyCafe().subscribe({
    next: (res: any) => {

      this.cafe = res.data ? res.data : res;

      const timestamp = new Date().getTime();

      this.logoUrl = `http://localhost:8080/api/cafes/${this.cafe.id}/logo?time=${timestamp}`;
      this.coverUrl = `http://localhost:8080/api/cafes/${this.cafe.id}/cover?time=${timestamp}`;

      // 🔥 FIX FOR GALLERY
      if (this.cafe.galleryImages?.length) {
        this.cafe.galleryImages = this.cafe.galleryImages.map((_: any, index: number) =>
          `http://localhost:8080/api/cafes/${this.cafe.id}/gallery/${index}?time=${timestamp}`
        );
      }

      this.generateMapUrl();
      this.loading = false;
    },
    error: () => {
      this.notification.error("Failed to load cafe details");
      this.loading = false;
    }
  });
}
  // ================= IMAGE ENDPOINTS =================
  // Always fetch image via backend (never DB path)

  // ================= TIME FORMAT =================
  formatTime(time: string): string {
    if (!time) return "";

    const [hour, minute] = time.split(":");
    let h = +hour;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;

    return `${h}:${minute} ${ampm}`;
  }

  // ================= NAVIGATE TO EDIT =================
  goToEditCafe(): void {
    this.router.navigate(["/owner/setup"], {
      queryParams: { id: this.cafe.id }
    });
  }

  // ================= MAP =================
  generateMapUrl(): void {
    const fullAddress = [
      this.cafe.address,
      this.cafe.city,
      this.cafe.state,
      this.cafe.pincode,
      "India"
    ]
      .filter(Boolean)
      .join(", ");

    if (!fullAddress) return;

    const url =
      "https://www.google.com/maps?q=" +
      encodeURIComponent(fullAddress) +
      "&output=embed";

    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // ================= LOGO =================
  onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedLogoFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  uploadLogo(): void {
    if (!this.selectedLogoFile) return;

    const formData = new FormData();
    formData.append("file", this.selectedLogoFile);

    this.apiService.uploadLogo(this.cafe.id, formData).subscribe({
      next: () => {
        this.notification.success("Logo uploaded");
        this.selectedLogoFile = null;
        this.logoPreview = null;
        this.loadCafe();
      },
      error: () => this.notification.error("Logo upload failed")
    });
  }

  // ================= COVER =================
  onCoverSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedCoverFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.coverPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  uploadCover(): void {
    if (!this.selectedCoverFile) return;

    const formData = new FormData();
    formData.append("file", this.selectedCoverFile);

    this.apiService.uploadCover(this.cafe.id, formData).subscribe({
      next: () => {
        this.notification.success("Cover uploaded");
        this.selectedCoverFile = null;
        this.coverPreview = null;
        this.loadCafe();
      },
      error: () => this.notification.error("Cover upload failed")
    });
  }

  // ================= GALLERY =================
  onGallerySelected(event: any) {
    const files = Array.from(event.target.files) as File[];

    const existingCount = this.cafe.galleryImages?.length || 0;

    if (existingCount + files.length > 4) {
      this.notification.error("Maximum 4 gallery images allowed.");
      return;
    }

    this.selectedGalleryFiles = files;
    this.galleryPreview = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        this.galleryPreview.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  uploadGallery(): void {
  if (!this.selectedGalleryFiles.length) return;

  const formData = new FormData();

  this.selectedGalleryFiles.forEach(file => {
    formData.append("files", file);
  });

  this.apiService.uploadGallery(this.cafe.id, formData).subscribe({
    next: () => {
      this.notification.success("Gallery uploaded successfully");

      // Reset selections
      this.selectedGalleryFiles = [];
      this.galleryPreview = [];

      // 🔥 IMPORTANT → Reload cafe to get fresh images
      this.loadCafe();
    },
    error: () => this.notification.error("Gallery upload failed")
  });
}
}