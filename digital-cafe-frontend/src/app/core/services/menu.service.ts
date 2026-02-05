import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MenuItem, Category } from '../../shared/models/menu-item.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  constructor(private apiService: ApiService) {}

  // Menu Items
  getAllMenuItems(): Observable<MenuItem[]> {
    return this.apiService.get<MenuItem[]>('/api/menu-items');
  }

  getMenuItem(id: number): Observable<MenuItem> {
    return this.apiService.get<MenuItem>(`/api/menu-items/${id}`);
  }

  getMenuItemsByCafe(cafeId: number): Observable<MenuItem[]> {
    return this.apiService.get<MenuItem[]>(`/api/menu-items/cafe/${cafeId}`);
  }

  getAvailableItems(cafeId: number): Observable<MenuItem[]> {
    return this.apiService.get<MenuItem[]>(`/api/menu-items/available/${cafeId}`);
  }

  getMenuItemsByCategory(cafeId: number, categoryId: number): Observable<MenuItem[]> {
    return this.apiService.get<MenuItem[]>(`/api/menu-items/cafe/${cafeId}/category/${categoryId}`);
  }

  createMenuItem(item: MenuItem): Observable<MenuItem> {
    return this.apiService.post<MenuItem>('/api/menu-items', item);
  }

  updateMenuItem(id: number, item: MenuItem): Observable<MenuItem> {
    return this.apiService.put<MenuItem>(`/api/menu-items/${id}`, item);
  }

  updateMenuItemAvailability(id: number, available: boolean): Observable<MenuItem> {
    return this.apiService.patch<MenuItem>(`/api/menu-items/${id}/availability`, { available });
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.apiService.delete<void>(`/api/menu-items/${id}`);
  }

  // Categories
  getAllCategories(): Observable<Category[]> {
    return this.apiService.get<Category[]>('/api/categories');
  }

  getCategory(id: number): Observable<Category> {
    return this.apiService.get<Category>(`/api/categories/${id}`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.apiService.post<Category>('/api/categories', category);
  }

  updateCategory(id: number, category: Category): Observable<Category> {
    return this.apiService.put<Category>(`/api/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.apiService.delete<void>(`/api/categories/${id}`);
  }
}
