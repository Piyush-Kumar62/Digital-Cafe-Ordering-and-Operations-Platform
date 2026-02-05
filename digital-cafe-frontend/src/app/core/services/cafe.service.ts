import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Cafe, CafeTable } from '../../shared/models/cafe.model';

@Injectable({
  providedIn: 'root'
})
export class CafeService {
  constructor(private apiService: ApiService) {}

  getAllCafes(): Observable<Cafe[]> {
    return this.apiService.get<Cafe[]>('/api/cafes');
  }

  getCafeById(id: number): Observable<Cafe> {
    return this.apiService.get<Cafe>(`/api/cafes/${id}`);
  }

  getCafesByOwner(ownerId: number): Observable<Cafe[]> {
    return this.apiService.get<Cafe[]>(`/api/cafes/owner/${ownerId}`);
  }

  createCafe(cafe: Cafe): Observable<Cafe> {
    return this.apiService.post<Cafe>('/api/cafes', cafe);
  }

  updateCafe(id: number, cafe: Cafe): Observable<Cafe> {
    return this.apiService.put<Cafe>(`/api/cafes/${id}`, cafe);
  }

  deleteCafe(id: number): Observable<void> {
    return this.apiService.delete<void>(`/api/cafes/${id}`);
  }

  // Table management
  getCafeTables(cafeId: number): Observable<CafeTable[]> {
    return this.apiService.get<CafeTable[]>(`/api/cafes/${cafeId}/tables`);
  }

  getAvailableTables(cafeId: number, date: string, time: string): Observable<CafeTable[]> {
    return this.apiService.get<CafeTable[]>(`/api/cafes/${cafeId}/tables/available?date=${date}&time=${time}`);
  }

  createTable(cafeId: number, table: CafeTable): Observable<CafeTable> {
    return this.apiService.post<CafeTable>(`/api/cafes/${cafeId}/tables`, table);
  }

  updateTableStatus(tableId: number, status: string): Observable<CafeTable> {
    return this.apiService.patch<CafeTable>(`/api/tables/${tableId}/status`, { status });
  }
}
