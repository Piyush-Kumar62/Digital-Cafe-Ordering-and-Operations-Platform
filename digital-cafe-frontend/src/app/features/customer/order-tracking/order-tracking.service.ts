import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '@shared/models/order.model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderTrackingService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) { }

  getOrderById(orderId: number): Observable<Order> {
    return this.http
      .get<{ data?: Order }>(`${this.apiUrl}/${orderId}`)
      .pipe(map((res) => res?.data as Order));
  }

  getMyOrders(): Observable<Order[]> {
    return this.http
      .get<{ data?: Order[] }>(`${this.apiUrl}/my-orders`)
      .pipe(map((res) => res?.data || []));
  }
}
