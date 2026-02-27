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

  // Check if cafe already exists
  checkCafeExists(): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/exists`);
  }

  // Create cafe during setup
  createCafe(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/setup`, data);
  }

// Get cafe details for owner dashboard
getOwnerCafe() {
  return this.http.get(`${this.baseUrl}/cafes/exists`);
}

}