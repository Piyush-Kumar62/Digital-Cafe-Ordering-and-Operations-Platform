import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Booking {
  id?: number;
  cafeId: number;
  cafeName?: string;
  tableId: number;
  tableNumber?: string;
  customerId?: number;
  customerName?: string;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  status: string;
  specialRequests?: string;
  createdAt?: string;
}

export interface BookingRequest {
  cafeId: number;
  tableId: number;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  specialRequests?: string;
}

export interface CafeTable {
  id: number;
  tableNumber: string;
  capacity: number;
  status: string;
  location?: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.apiUrl);
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  getMyBookings(): Observable<Booking[]> {
    const customerId = this.getCurrentUserId();
    return this.http.get<Booking[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  getBookingsByCafe(cafeId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/cafe/${cafeId}`);
  }

  createBooking(booking: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, booking);
  }

  updateBookingStatus(id: number, status: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}/status`, { status });
  }

  cancelBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAvailableTables(cafeId: number, date: string, time: string): Observable<CafeTable[]> {
    return this.http.get<CafeTable[]>(`${this.apiUrl}/available-tables`, {
      params: { cafeId: cafeId.toString(), date, time },
    });
  }

  private getCurrentUserId(): number {
    // Get from auth service or local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 0;
  }
}
