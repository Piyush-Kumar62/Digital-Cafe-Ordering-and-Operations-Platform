import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { NotificationService } from "@core/services/notification.service";
import { MenuItem, MenuCategory } from "@shared/models/menu.model";

@Component({
  selector: "app-owner-menu",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="owner-page">
      <header class="page-header">
        <h1>Menu Management</h1>
        <p>Add and manage cafe menu items.</p>
      </header>

      <form class="card form-grid" (ngSubmit)="createMenuItem()">
        <input [(ngModel)]="draft.name" name="name" placeholder="Item name" required />
        <select [(ngModel)]="draft.category" name="category" required>
          <option value="" disabled>Select category</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
        <input [(ngModel)]="draft.price" name="price" type="number" min="1" placeholder="Price" required />
        <input [(ngModel)]="draft.preparationTimeMinutes" name="preparationTimeMinutes" type="number" min="1" placeholder="Prep time (min)" required />
        <textarea [(ngModel)]="draft.description" name="description" placeholder="Description"></textarea>
        <label class="checkbox"><input type="checkbox" [(ngModel)]="draft.isAvailable" name="isAvailable" /> Available</label>
        <button type="submit">Add Menu Item</button>
      </form>

      <div class="grid">
        <article class="card item" *ngFor="let item of menuItems">
          <div>
            <h3>{{ item.name }}</h3>
            <p>{{ item.category }} • {{ item.price | currency:'INR' }}</p>
          </div>
          <div class="actions">
            <span [class.ok]="item.isAvailable" [class.bad]="!item.isAvailable">
              {{ item.isAvailable ? 'Available' : 'Hidden' }}
            </span>
            <button (click)="toggleAvailability(item)">{{ item.isAvailable ? 'Hide' : 'Show' }}</button>
            <button class="danger" (click)="deleteItem(item.id)">Delete</button>
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
    .form-grid { display: grid; gap: .7rem; grid-template-columns: repeat(2, minmax(0,1fr)); margin-bottom: 1rem; }
    input, select, textarea, button { border: 1px solid #cbd5e1; border-radius: 10px; padding: .55rem .65rem; font: inherit; }
    textarea { grid-column: span 2; min-height: 80px; resize: vertical; }
    .checkbox { display: flex; align-items: center; gap: .5rem; color: #334155; }
    button { background: #0ea5e9; color: #fff; border: 0; font-weight: 700; cursor: pointer; }
    .grid { display: grid; gap: .8rem; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: .8rem; }
    .item h3 { margin: 0; }
    .item p { margin: .2rem 0 0; color: #64748b; font-size: .9rem; }
    .actions { display: flex; align-items: center; gap: .45rem; }
    .actions span { font-size: .8rem; font-weight: 700; padding: .2rem .45rem; border-radius: 999px; }
    .actions .ok { background: #dcfce7; color: #166534; }
    .actions .bad { background: #fee2e2; color: #991b1b; }
    .actions .danger { background: #ef4444; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } textarea { grid-column: span 1; } .item { flex-direction: column; align-items: flex-start; } }
  `],
})
export class OwnerMenuComponent implements OnInit {
  menuItems: MenuItem[] = [];
  categories = Object.values(MenuCategory);
  cafeId: number | null = null;
  draft = {
    name: "",
    description: "",
    price: 0,
    category: "",
    isAvailable: true,
    preparationTimeMinutes: 10,
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.cafeId = this.authService.currentUserValue?.cafeId || null;
    this.loadItems();
  }

  loadItems(): void {
    if (!this.cafeId) return;
    this.apiService.getMenuItemsByCafe(this.cafeId).subscribe({
      next: (items) => this.menuItems = items || [],
    });
  }

  createMenuItem(): void {
    if (!this.cafeId) return;
    this.apiService.createMenuItem(this.cafeId, this.draft).subscribe({
      next: () => {
        this.notificationService.success("Menu item created.");
        this.draft = { name: "", description: "", price: 0, category: "", isAvailable: true, preparationTimeMinutes: 10 };
        this.loadItems();
      },
      error: () => this.notificationService.error("Failed to create menu item."),
    });
  }

  toggleAvailability(item: MenuItem): void {
    this.apiService.toggleMenuItemAvailability(item.id, !item.isAvailable).subscribe({
      next: () => this.loadItems(),
    });
  }

  deleteItem(id: number): void {
    this.apiService.deleteMenuItem(id).subscribe({
      next: () => {
        this.notificationService.success("Menu item deleted.");
        this.loadItems();
      },
    });
  }
}
