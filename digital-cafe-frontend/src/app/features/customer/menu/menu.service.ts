import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem } from '@shared/models/menu.model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = `${environment.apiUrl}/menu-items`;

  constructor(private http: HttpClient) { }

  // Using a hardcoded cafeId for now as per plan.
  // In a real app, this would come from user selection or context.
  getMenuItems(cafeId: number = 1): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.apiUrl}/cafe/${cafeId}/available`);
  }
}
