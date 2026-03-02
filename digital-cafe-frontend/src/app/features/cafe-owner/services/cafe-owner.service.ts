import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CafeOwnerService {

  private baseUrl = `${environment.apiUrl}/cafes`;

  constructor(private http: HttpClient) {}

  checkCafeExists(): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/exists`);
  }

  createCafe(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/setup`, data);
  }

  getOwnerCafe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/exists`);
  }

}