import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MenuItem } from '@shared/models/menu.model';
import { Cafe } from '@shared/models/cafe.model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuApiUrl = `${environment.apiUrl}/menu-items`;
  private cafeApiUrl = `${environment.apiUrl}/cafes`;

  constructor(private http: HttpClient) { }

  getMenuItems(cafeId: number): Observable<MenuItem[]> {
    return this.http
      .get<{ data?: MenuItem[] }>(`${this.menuApiUrl}/cafe/${cafeId}/available`)
      .pipe(map((res) => res?.data || []));
  }

  getActiveCafes(): Observable<Cafe[]> {
    return this.http
      .get<{ data?: Cafe[] }>(`${this.cafeApiUrl}/active`)
      .pipe(map((res) => res?.data || []));
  }
}
