import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../core/services/menu.service';
import { OrderService } from '../../core/services/order.service';
import { MenuItem, Category } from '../../shared/models/menu-item.model';
import { CartItem } from '../../shared/models/order.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  menuItems: MenuItem[] = [];
  filteredItems: MenuItem[] = [];
  categories: Category[] = [];
  selectedCategory: string = 'all';
  selectedCafeId: number = 1;
  isLoading = false;
  searchTerm = '';

  constructor(
    private menuService: MenuService,
    private orderService: OrderService,
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadMenuItems();
  }

  loadCategories() {
    this.menuService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => console.error('Error loading categories:', error),
    });
  }

  loadMenuItems() {
    this.isLoading = true;
    this.menuService.getAvailableItems(this.selectedCafeId).subscribe({
      next: (items) => {
        this.menuItems = items;
        this.filteredItems = items;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
        this.isLoading = false;
      },
    });
  }

  filterByCategory(categoryId: string) {
    this.selectedCategory = categoryId;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  applyFilters() {
    let items = this.menuItems;

    // Filter by category
    if (this.selectedCategory !== 'all') {
      items = items.filter((item) => item.categoryId === parseInt(this.selectedCategory));
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(term) || item.description.toLowerCase().includes(term),
      );
    }

    this.filteredItems = items;
  }

  addToCart(item: MenuItem) {
    const cartItem: CartItem = {
      menuItemId: item.id!,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
    };

    this.orderService.addToCart(cartItem);
    alert(`${item.name} added to cart!`);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  }
}
