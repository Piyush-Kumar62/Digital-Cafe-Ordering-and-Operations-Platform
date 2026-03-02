import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MenuItem } from '@shared/models/menu.model';
import { Cafe } from '@shared/models/cafe.model';
import { environment } from '@environments/environment';
import { Booking, BookingRequest } from '@shared/models/booking.model';
import { Order, OrderRequest } from '@shared/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuApiUrl = `${environment.apiUrl}/menu`;
  private bookingApiUrl = `${environment.apiUrl}/bookings`;
  private orderApiUrl = `${environment.apiUrl}/orders`;
  private cafeApiUrl = `${environment.apiUrl}/cafes`;
  private tableApiUrl = `${environment.apiUrl}/tables`;

  constructor(private http: HttpClient) { }

  getMenuItems(cafeId: number): Observable<MenuItem[]> {
    return this.http
      .get<{ data?: MenuItem[] }>(`${this.menuApiUrl}/${cafeId}`)
      .pipe(map((res) => res?.data || []));
  }

  getActiveCafes(): Observable<Cafe[]> {
    return this.http
      .get<{ data?: Cafe[] }>(`${this.cafeApiUrl}/active`)
      .pipe(map((res) => res?.data || []));
  }

  getSystemActiveCafes(): Observable<Cafe[]> {
    return this.http
      .get<{ data?: Cafe[] }>(`${this.cafeApiUrl}/active`)
      .pipe(map((res) => res?.data || []));
  }

  getAvailableTables(cafeId: number, date: string, timeSlot: string, seats?: number) {
    const params = new HttpParams()
      .set('cafeId', String(cafeId))
      .set('date', date)
      .set('timeSlot', timeSlot)
      .set('seats', String(seats && seats > 0 ? seats : 1));

    return this.http
      .get<{ data?: any[] }>(`${this.tableApiUrl}/available`, { params })
      .pipe(map((res) => res?.data || []));
  }

  createBooking(payload: BookingRequest): Observable<Booking> {
    return this.http
      .post<{ data?: Booking }>(`${this.bookingApiUrl}`, payload)
      .pipe(map((res) => res?.data as Booking));
  }

  createOrder(payload: OrderRequest): Observable<Order> {
    return this.http
      .post<{ data?: Order }>(`${this.orderApiUrl}`, payload)
      .pipe(map((res) => res?.data as Order));
  }

  getOrderById(orderId: number): Observable<Order> {
    return this.http
      .get<{ data?: Order }>(`${this.orderApiUrl}/${orderId}`)
      .pipe(map((res) => res?.data as Order));
  }
}
