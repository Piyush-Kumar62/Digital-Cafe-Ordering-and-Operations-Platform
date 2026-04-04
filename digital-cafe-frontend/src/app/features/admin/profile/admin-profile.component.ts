import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subject, takeUntil, finalize } from "rxjs";
import { AuthService } from "@core/auth/auth.service";
import { AlertService } from "@core/services/alert.service";
import { ThemeService } from "@core/services/theme.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { environment } from "@environments/environment";
import {
  AdminProfile,
  AdminProfileUpdateRequest,
  PreferenceTheme,
} from "@shared/models/admin-profile.model";
import { AdminProfileService } from "./admin-profile.service";

@Component({
  selector: "app-admin-profile",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./admin-profile.component.html",
  styleUrl: "./admin-profile.component.scss",
})
export class AdminProfileComponent implements OnInit, OnDestroy {
  @ViewChild("profileFileInput")
  profileFileInput?: ElementRef<HTMLInputElement>;

  profile: AdminProfile | null = null;
  form: AdminProfileUpdateRequest = {
    firstName: "",
    lastName: "",
    displayName: "",
    theme: "LIGHT",
    autoRefreshSeconds: 15,
    adminNotificationsEnabled: true,
  };

  imagePreviewUrl: string | null = null;
  selectedImageFile: File | null = null;

  loading = false;
  savingProfile = false;
  uploadingImage = false;
  deletingImage = false;
  imageModalOpen = false;
  imageEditMode = false;
  activeEditorTab: "crop" | "filter" | "adjust" = "crop";
  editorImageSource: string | null = null;
  editorAspectRatio = 1;
  editorZoom = 1;
  editorOffsetX = 0;
  editorOffsetY = 0;
  editorRotation = 0;
  editorGrayscale = 0;
  editorBrightness = 100;
  editorContrast = 100;
  editorSaturate = 100;
  editorDragging = false;
  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartOffsetX = 0;
  private dragStartOffsetY = 0;
  readonly minEditorZoom = 0.8;
  readonly maxEditorZoom = 4;
  wsDestination: string | null = null;

  readonly themeOptions: PreferenceTheme[] = ["LIGHT", "DARK"];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private adminProfileService: AdminProfileService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private alertService: AlertService,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    if (this.wsDestination) {
      this.webSocketService.unsubscribe(this.wsDestination);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fullName(): string {
    if (!this.profile) return "Admin User";
    const display = (this.profile.displayName || "").trim();
    if (display) {
      return display;
    }
    const value =
      `${this.profile.firstName || ""} ${this.profile.lastName || ""}`.trim();
    return value || "Admin User";
  }

  get roleLabel(): string {
    return (this.profile?.role || "ROLE_ADMIN").replace("ROLE_", "");
  }

  get imageUrl(): string {
    if (this.imagePreviewUrl) {
      return this.imagePreviewUrl;
    }
    if (!this.profile?.profileImageUrl) {
      return "";
    }
    if (this.profile.profileImageUrl.startsWith("http")) {
      return this.profile.profileImageUrl;
    }
    const backendBase = environment.apiUrl.replace("/api", "");
    return `${backendBase}${this.profile.profileImageUrl}`;
  }

  get profileReady(): boolean {
    return !!this.profile;
  }

  get currentCompletionPercentage(): number {
    const filled = [
      String(this.form.firstName || "").trim().length > 0,
      String(this.form.lastName || "").trim().length > 0,
      String(this.form.displayName || "").trim().length > 0,
      String(this.profile?.email || "").trim().length > 0,
      !!(this.imagePreviewUrl || this.profile?.profileImageUrl),
    ].filter(Boolean).length;

    return Math.round((filled * 100) / 5);
  }

  loadProfile(): void {
    this.loading = true;
    this.adminProfileService
      .getProfile()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          this.bindRealtimeProfileUpdates();
        },
        error: (error) => {
          this.alertService.error(
            error?.message || "Failed to load admin profile",
          );
        },
      });
  }

  saveProfile(): void {
    if (!this.profile || this.savingProfile) {
      return;
    }

    const payload: AdminProfileUpdateRequest = {
      firstName: (this.form.firstName || "").trim(),
      lastName: (this.form.lastName || "").trim(),
      displayName: (this.form.displayName || "").trim(),
      theme: this.form.theme,
      autoRefreshSeconds: Math.min(
        120,
        Math.max(5, Number(this.form.autoRefreshSeconds || 15)),
      ),
      adminNotificationsEnabled: !!this.form.adminNotificationsEnabled,
    };

    if (!payload.firstName || !payload.lastName || !payload.displayName) {
      this.alertService.error(
        "First name, last name, and display name are required",
      );
      return;
    }

    this.savingProfile = true;
    this.adminProfileService
      .updateProfile(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.savingProfile = false)),
      )
      .subscribe({
        next: (updatedProfile) => {
          this.form = payload;
          this.applyProfile(updatedProfile);
          this.alertService.success("Profile details saved successfully");
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message || error?.message || "Failed to save profile";
          this.alertService.error(errorMessage);
        },
      });
  }

  onThemeChange(theme: PreferenceTheme): void {
    this.form.theme = theme;
    this.applyTheme(theme);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      this.alertService.error("Please select an image file");
      input.value = "";
      return;
    }

    const twoMb = 2 * 1024 * 1024;
    if (file.size > twoMb) {
      this.alertService.error("Profile image must be 2MB or less");
      input.value = "";
      return;
    }

    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = String(reader.result || "");
      this.openImageEditor(this.imagePreviewUrl);
    };
    reader.readAsDataURL(file);
  }

  async uploadSelectedImage(): Promise<void> {
    if (this.uploadingImage) {
      return;
    }

    // If user clicks Update while editing, render only when edits changed.
    if (this.imageEditMode && this.hasEditorChanges()) {
      const rendered = await this.renderEditedImage();
      if (!rendered) {
        return;
      }
      this.selectedImageFile = rendered.file;
      this.imagePreviewUrl = rendered.previewUrl;
      this.imageEditMode = false;
      this.editorAspectRatio = 1;
    }

    if (!this.selectedImageFile) {
      this.alertService.warning("Select and apply an image before updating");
      return;
    }

    this.uploadingImage = true;
    this.adminProfileService
      .uploadProfileImage(this.selectedImageFile)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.uploadingImage = false)),
      )
      .subscribe({
        next: (response) => {
          const uploadedImagePath = response?.profileImageUrl || "";
          const uploadedImageUrl =
            this.resolveBackendImageUrl(uploadedImagePath);

          this.imagePreviewUrl = uploadedImageUrl || null;
          this.selectedImageFile = null;
          this.imageEditMode = false;
          this.editorImageSource = null;
          this.resetEditorControls();

          const currentUser = this.authService.currentUserValue;
          if (currentUser && uploadedImagePath) {
            this.authService.updateUserData({
              ...currentUser,
              avatarUrl: uploadedImagePath,
              profileImageUrl: uploadedImagePath,
            });
          }

          this.loadProfile();
          this.alertService.success("Profile image uploaded");
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message || error?.message || "Failed to upload image";
          this.alertService.error(errorMessage);
        },
      });
  }

  deleteProfileImage(): void {
    if (this.deletingImage) {
      return;
    }

    this.deletingImage = true;
    this.adminProfileService
      .deleteProfileImage()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.deletingImage = false)),
      )
      .subscribe({
        next: () => {
          this.imagePreviewUrl = null;
          this.selectedImageFile = null;
          this.imageEditMode = false;
          this.editorImageSource = null;
          this.resetEditorControls();
          this.loadProfile();
          this.alertService.success("Profile photo deleted");
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message ||
            error?.message ||
            "Failed to delete profile photo";
          this.alertService.error(errorMessage);
        },
      });
  }

  cancelImageSelection(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.imageEditMode = false;
    this.editorImageSource = null;
    this.resetEditorControls();
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  openImageModal(): void {
    this.imageModalOpen = true;
    this.imageEditMode = false;
    this.syncEditorAspect(this.imageUrl || null);
    this.resetEditorControls();
  }

  closeImageModal(): void {
    this.imageModalOpen = false;
    this.imageEditMode = false;
    this.resetEditorControls();
  }

  triggerFileSelection(): void {
    this.profileFileInput?.nativeElement.click();
  }

  openImageEditor(source?: string | null): void {
    this.imageModalOpen = true;
    this.imageEditMode = true;
    this.editorImageSource = source || this.imageUrl || null;
    this.syncEditorAspect(this.editorImageSource);
    this.resetEditorControls();
  }

  selectEditorTab(tab: "crop" | "filter" | "adjust"): void {
    this.activeEditorTab = tab;
  }

  applyImageEdit(): void {
    this.renderEditedImage().then((rendered) => {
      if (!rendered) {
        return;
      }
      this.selectedImageFile = rendered.file;
      this.imagePreviewUrl = rendered.previewUrl;
      this.imageEditMode = false;
      this.editorAspectRatio = 1;
    });
  }

  getEditorImageStyle(): Record<string, string> {
    const zoom = this.editorZoom;
    const offsetX = this.editorOffsetX;
    const offsetY = this.editorOffsetY;
    const rotation = this.editorRotation;

    return {
      transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom}) rotate(${rotation}deg)`,
      filter: this.getEditorFilterStyle(),
    };
  }

  rotateLeft(): void {
    this.editorRotation = (this.editorRotation - 90 + 360) % 360;
  }

  rotateRight(): void {
    this.editorRotation = (this.editorRotation + 90) % 360;
  }

  onEditorPointerDown(event: PointerEvent): void {
    if (!this.imageEditMode) {
      return;
    }

    this.editorDragging = true;
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartOffsetX = this.editorOffsetX;
    this.dragStartOffsetY = this.editorOffsetY;

    const target = event.currentTarget as HTMLElement | null;
    target?.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  onEditorPointerMove(event: PointerEvent): void {
    if (
      !this.imageEditMode ||
      !this.editorDragging ||
      this.dragPointerId !== event.pointerId
    ) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }

    const width = Math.max(target.clientWidth, 1);
    const height = Math.max(target.clientHeight, 1);

    // Keep drag precise and controlled like LinkedIn editor.
    const sensitivity = 0.85 / Math.max(this.editorZoom, 1);
    const deltaXPercent =
      ((event.clientX - this.dragStartX) / width) * 100 * sensitivity;
    const deltaYPercent =
      ((event.clientY - this.dragStartY) / height) * 100 * sensitivity;

    const maxOffset = this.getMaxEditorOffset();
    this.editorOffsetX = this.clamp(
      this.dragStartOffsetX + deltaXPercent,
      -maxOffset,
      maxOffset,
    );
    this.editorOffsetY = this.clamp(
      this.dragStartOffsetY + deltaYPercent,
      -maxOffset,
      maxOffset,
    );
    event.preventDefault();
  }

  onEditorPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) {
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    target?.releasePointerCapture?.(event.pointerId);

    this.editorDragging = false;
    this.dragPointerId = null;
  }

  onEditorZoomChange(value: number): void {
    this.editorZoom = Number(value);
    const maxOffset = this.getMaxEditorOffset();
    this.editorOffsetX = this.clamp(this.editorOffsetX, -maxOffset, maxOffset);
    this.editorOffsetY = this.clamp(this.editorOffsetY, -maxOffset, maxOffset);
  }

  onEditorWheel(event: WheelEvent): void {
    if (!this.imageEditMode) {
      return;
    }

    const direction = event.deltaY < 0 ? 1 : -1;
    const step = 0.02;
    const nextZoom = this.clamp(
      this.editorZoom + direction * step,
      this.minEditorZoom,
      this.maxEditorZoom,
    );
    this.onEditorZoomChange(nextZoom);
    event.preventDefault();
  }

  private bindRealtimeProfileUpdates(): void {
    const userId = this.authService.currentUserValue?.id;
    if (!userId || this.wsDestination) {
      return;
    }

    this.wsDestination = `/topic/profile/${userId}`;
    this.webSocketService
      .watchDestination<AdminProfile>(this.wsDestination)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => this.applyProfile(profile),
      });
  }

  private applyProfile(profile: AdminProfile): void {
    this.profile = profile;
    this.form = {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      displayName: profile.displayName || "",
      theme: profile.preferences?.theme || "LIGHT",
      autoRefreshSeconds: profile.preferences?.autoRefreshSeconds ?? 15,
      adminNotificationsEnabled:
        profile.preferences?.adminNotificationsEnabled ?? true,
    };

    this.applyTheme(this.form.theme);

    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.authService.updateUserData({
        ...currentUser,
        firstName: profile.firstName || currentUser.firstName,
        lastName: profile.lastName || currentUser.lastName,
        username: profile.displayName || currentUser.username,
        avatarUrl: profile.profileImageUrl || currentUser.avatarUrl,
      });
    }
  }

  private applyTheme(theme: PreferenceTheme): void {
    this.themeService.setTheme(theme === "DARK");
  }

  private resetEditorControls(): void {
    this.activeEditorTab = "crop";
    this.editorZoom = 1;
    this.editorOffsetX = 0;
    this.editorOffsetY = 0;
    this.editorRotation = 0;
    this.editorGrayscale = 0;
    this.editorBrightness = 100;
    this.editorContrast = 100;
    this.editorSaturate = 100;
    this.editorDragging = false;
    this.dragPointerId = null;
  }

  private getEditorFilterStyle(): string {
    return `grayscale(${this.editorGrayscale}%) brightness(${this.editorBrightness}%) contrast(${this.editorContrast}%) saturate(${this.editorSaturate}%)`;
  }

  private hasEditorChanges(): boolean {
    return (
      Math.abs(this.editorZoom - 1) > 0.001 ||
      Math.abs(this.editorOffsetX) > 0.001 ||
      Math.abs(this.editorOffsetY) > 0.001 ||
      this.editorRotation !== 0 ||
      this.editorGrayscale !== 0 ||
      this.editorBrightness !== 100 ||
      this.editorContrast !== 100 ||
      this.editorSaturate !== 100
    );
  }

  private renderEditedImage(): Promise<{
    file: File;
    previewUrl: string;
  } | null> {
    return new Promise((resolve) => {
      if (!this.editorImageSource) {
        resolve(null);
        return;
      }

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          this.alertService.error("Unable to process image");
          resolve(null);
          return;
        }

        const outputSize = canvas.width;
        // Preserve full image by default (no auto-cut). User can zoom/pan for tighter crop.
        const baseScale = Math.min(
          outputSize / image.width,
          outputSize / image.height,
        );
        const drawWidth = image.width * baseScale;
        const drawHeight = image.height * baseScale;
        const translateX = (this.editorOffsetX / 100) * outputSize;
        const translateY = (this.editorOffsetY / 100) * outputSize;
        const rotationRad = (this.editorRotation * Math.PI) / 180;
        const filter = this.getEditorFilterStyle();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.filter = filter;
        ctx.translate(outputSize / 2, outputSize / 2);
        ctx.translate(translateX, translateY);
        ctx.scale(this.editorZoom, this.editorZoom);
        ctx.rotate(rotationRad);
        ctx.drawImage(
          image,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight,
        );
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              this.alertService.error("Image processing failed");
              resolve(null);
              return;
            }
            resolve({
              file: new File([blob], "profile-image.jpg", {
                type: "image/jpeg",
              }),
              previewUrl: URL.createObjectURL(blob),
            });
          },
          "image/jpeg",
          0.95,
        );
      };
      image.onerror = () => {
        this.alertService.error("Unable to read selected image");
        resolve(null);
      };
      image.src = this.editorImageSource;
    });
  }

  private syncEditorAspect(source: string | null): void {
    if (!source) {
      this.editorAspectRatio = 1;
      return;
    }

    const image = new Image();
    image.onload = () => {
      if (!image.width || !image.height) {
        this.editorAspectRatio = 1;
        return;
      }

      const rawRatio = image.width / image.height;
      this.editorAspectRatio = this.clamp(rawRatio, 0.5, 2.5);
    };
    image.onerror = () => {
      this.editorAspectRatio = 1;
    };
    image.src = source;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private getMaxEditorOffset(): number {
    // Allow enough panning room to center faces while staying bounded.
    const zoom = Math.max(this.editorZoom, this.minEditorZoom);
    if (zoom <= this.minEditorZoom) {
      return 16;
    }

    const normalizedZoom =
      (zoom - this.minEditorZoom) /
      Math.max(this.maxEditorZoom - this.minEditorZoom, 1);
    return this.clamp(16 + normalizedZoom * 24, 16, 40);
  }

  private resolveBackendImageUrl(value: string): string {
    if (!value) {
      return "";
    }
    if (value.startsWith("http")) {
      return value;
    }
    const backendBase = environment.apiUrl.replace("/api", "");
    return `${backendBase}${value}`;
  }
}
