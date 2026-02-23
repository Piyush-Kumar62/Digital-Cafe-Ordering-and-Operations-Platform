import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from '@shared/models/menu.model';
import { Cafe } from '@shared/models/cafe.model';
import { MenuService } from './menu.service';
import { CartService } from '../cart/cart.service';
import { CustomerJourneyService } from '../customer-journey.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  cafes: Cafe[] = [];
  menuItems: MenuItem[] = [];
  selectedCafeId: number | null = null;
  loading = false;
  searchText = '';
  selectedCategory = 'ALL';
  categories: string[] = [];
  addedItemId: number | null = null;
  private readonly fallbackImages: Record<string, string> = {
    APPETIZER: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=900&q=80',
    MAIN_COURSE: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80',
    DESSERT: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80',
    BEVERAGE: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80',
    SNACK: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
    DEFAULT: 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=900&q=80',
  };

  constructor(
    private menuService: MenuService,
    private cartService: CartService,
    private customerJourneyService: CustomerJourneyService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    const queryCafeId = Number(this.route.snapshot.queryParamMap.get('cafeId'));
    const savedCafeId = this.customerJourneyService.getSelectedCafeId();
    this.selectedCafeId = Number.isFinite(queryCafeId) && queryCafeId > 0
      ? queryCafeId
      : savedCafeId;
    this.loadCafes();
  }

  addToCart(item: MenuItem): void {
    this.cartService.addItem(item);
    this.addedItemId = item.id;
    setTimeout(() => {
      if (this.addedItemId === item.id) {
        this.addedItemId = null;
      }
    }, 900);
  }

  onCafeChange(cafeId: string): void {
    const parsed = Number(cafeId);
    this.selectedCafeId = Number.isNaN(parsed) ? null : parsed;
    this.customerJourneyService.setSelectedCafeId(this.selectedCafeId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { cafeId: this.selectedCafeId || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.loadMenuItems();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedCategory = 'ALL';
  }

  getMenuImage(item: MenuItem): string {
    if (item.imageUrl && /^https?:\/\//i.test(item.imageUrl)) {
      return item.imageUrl;
    }
    const key = (item.category || '').toUpperCase();
    return this.fallbackImages[key] || this.fallbackImages['DEFAULT'];
  }

  onImageError(event: Event, item: MenuItem): void {
    const el = event.target as HTMLImageElement;
    if (!el) {
      return;
    }
    el.onerror = null;
    el.src = this.fallbackImages['DEFAULT'];
    el.alt = `${item.name} image`;
  }

  get filteredMenuItems(): MenuItem[] {
    const query = this.searchText.trim().toLowerCase();
    return this.menuItems.filter((item) => {
      const categoryMatch =
        this.selectedCategory === 'ALL' ||
        (item.category || '').toUpperCase() === this.selectedCategory;
      const textMatch =
        !query ||
        (item.name || '').toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query);
      return categoryMatch && textMatch;
    });
  }

  private loadCafes(): void {
    this.menuService.getActiveCafes().subscribe({
      next: (cafes) => {
        this.cafes = cafes || [];
        if (!this.selectedCafeId && this.cafes.length) {
          this.selectedCafeId = this.cafes[0].id;
          this.customerJourneyService.setSelectedCafeId(this.selectedCafeId);
        }
        this.loadMenuItems();
      },
      error: () => {
        this.cafes = [];
        this.menuItems = [];
      },
    });
  }

  private loadMenuItems(): void {
    if (!this.selectedCafeId) {
      this.menuItems = [];
      return;
    }
    this.loading = true;
    this.menuService.getMenuItems(this.selectedCafeId).subscribe({
      next: (items) => {
        this.menuItems = (items || []).map((item) => ({
          ...item,
          preparationTime:
            item.preparationTime ??
            item.preparationTimeMinutes ??
            0,
        }));
        this.categories = [
          'ALL',
          ...Array.from(
            new Set(
              this.menuItems
                .map((item) => (item.category || '').toUpperCase())
                .filter((category) => !!category),
            ),
          ),
        ];
        this.selectedCategory = 'ALL';
        this.loading = false;
      },
      error: () => {
        this.menuItems = [];
        this.categories = ['ALL'];
        this.loading = false;
      },
    });
  }
}
