import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
@Injectable({
  providedIn: 'root'
})
export class TableService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyTables(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tables/my`);
  }

  createTable(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tables/my`, data);
  }

  updateTable(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tables/${id}`, data);
  }

  deleteTable(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tables/${id}`);
  }

  toggleAvailability(id: number, available: boolean): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/tables/${id}/availability?isAvailable=${available}`,
      {}
    );
  }
}