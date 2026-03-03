import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import {
  MenuCategory,
  MenuItem,
  MenuItemRequest,
} from "@shared/models/menu.model";

@Component({
  selector: "app-owner-menu",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./owner-menu.component.html",
  styleUrls: ["./owner-menu.component.scss"],
})
export class OwnerMenuComponent implements OnInit {
  menuItems: MenuItem[] = [];
  categories = Object.values(MenuCategory);
  cafeId: number | null = null;
  loading = false;
  saving = false;
  searchText = "";
  categoryFilter = "";

  showForm = false;
  isEditMode = false;
  editingItemId: number | null = null;
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;

  draft: MenuItemRequest = this.emptyDraft();

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Check if a specific cafeId is passed via query param (multi-cafe support)
    const queryId = this.route.snapshot.queryParamMap.get("cafeId");
    if (queryId) {
      this.cafeId = +queryId;
      this.loadItems();
      return;
    }
    this.apiService.cafeExistsForOwner().subscribe({
      next: (exists) => {
        if (!exists) {
          this.router.navigate(["/owner/setup"]);
          return;
        }
        this.apiService.getMyCafe().subscribe({
          next: (cafe) => {
            this.cafeId = cafe.id;
            this.loadItems();
          },
          error: () => this.alertService.error("Unable to load cafe."),
        });
      },
      error: () => this.alertService.error("Unable to validate cafe status."),
    });
  }

  private emptyDraft(): MenuItemRequest {
    return {
      name: "",
      description: "",
      price: 0,
      category: "",
      isAvailable: true,
      preparationTimeMinutes: 10,
    };
  }

  get filteredItems(): MenuItem[] {
    const q = this.searchText.trim().toLowerCase();
    return (this.menuItems || []).filter((item) => {
      const categoryOk =
        !this.categoryFilter || item.category === this.categoryFilter;
      const textOk = !q || (item.name || "").toLowerCase().includes(q);
      return categoryOk && textOk;
    });
  }

  get availableCount(): number {
    return this.menuItems.filter((item) => item.isAvailable).length;
  }

  get hiddenCount(): number {
    return this.menuItems.filter((item) => !item.isAvailable).length;
  }

  loadItems(): void {
    if (!this.cafeId) return;
    this.loading = true;
    this.apiService.getMenuItemsByCafe(this.cafeId).subscribe({
      next: (items) => {
        this.menuItems = items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.alertService.error("Failed to load menu items.");
      },
    });
  }

  openCreate(): void {
    this.isEditMode = false;
    this.editingItemId = null;
    this.draft = this.emptyDraft();
    this.showForm = true;
  }

  openEdit(item: MenuItem): void {
    this.isEditMode = true;
    this.editingItemId = item.id;
    this.imagePreviewUrl =
      this.apiService.resolveImageUrl((item as any).imageUrl) || null;
    this.selectedImageFile = null;
    this.draft = {
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      preparationTimeMinutes:
        item.preparationTimeMinutes || (item as any).preparationTime || 10,
      imageUrl: (item as any).imageUrl || undefined,
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingItemId = null;
    this.draft = this.emptyDraft();
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreviewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  saveMenuItem(): void {
    if (!this.cafeId) return;
    if (
      !this.draft.name.trim() ||
      !this.draft.category ||
      this.draft.price <= 0
    ) {
      this.alertService.error(
        "Please enter valid item details (name, category, price > 0).",
      );
      return;
    }
    this.saving = true;

    const doSave = (imageUrl?: string) => {
      if (imageUrl) {
        this.draft.imageUrl = imageUrl; // store relative path for backend
        // update preview to the resolved full URL
        this.imagePreviewUrl =
          this.apiService.resolveImageUrl(imageUrl) || null;
      }
      const obs =
        this.isEditMode && this.editingItemId != null
          ? this.apiService.updateMenuItem(this.editingItemId, this.draft)
          : this.apiService.createMenuItem(this.cafeId!, this.draft);

      obs.subscribe({
        next: () => {
          this.saving = false;
          this.alertService.success(
            this.isEditMode ? "Menu item updated." : "Menu item created.",
          );
          this.cancelForm();
          this.loadItems();
        },
        error: (err) => {
          this.saving = false;
          this.alertService.error(
            err?.error?.message || "Failed to save menu item.",
          );
        },
      });
    };

    if (this.selectedImageFile) {
      this.apiService.uploadMenuItemImage(this.selectedImageFile).subscribe({
        next: (url) => doSave(url),
        error: () => {
          this.saving = false;
          this.alertService.error("Failed to upload image. Please try again.");
        },
      });
    } else {
      doSave();
    }
  }

  toggleAvailability(item: MenuItem): void {
    this.apiService
      .toggleMenuItemAvailability(item.id, !item.isAvailable)
      .subscribe({
        next: () => this.loadItems(),
        error: () => this.alertService.error("Failed to update availability."),
      });
  }

  async deleteItem(id: number): Promise<void> {
    const confirmed = await this.alertService.confirm(
      "Delete Item",
      "Are you sure you want to delete this menu item?",
    );
    if (!confirmed) return;
    this.apiService.deleteMenuItem(id).subscribe({
      next: () => {
        this.alertService.success("Menu item deleted.");
        this.loadItems();
      },
      error: () => this.alertService.error("Failed to delete menu item."),
    });
  }

  categoryLabel(cat: string): string {
    return cat
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Returns a browser-loadable URL for a menu item's image. */
  getItemImage(item: MenuItem): string {
    return this.apiService.resolveImageUrl((item as any).imageUrl) || "";
  }
}
