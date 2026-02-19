import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingRequest } from '@shared/models/booking.model';
import { environment } from '@environments/environment';
import { Table } from '@shared/models/cafe.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingApiUrl = `${environment.apiUrl}/bookings`;
  private tableApiUrl = `${environment.apiUrl}/tables`;

  constructor(private http: HttpClient) { }

  createBooking(bookingRequest: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.bookingApiUrl, bookingRequest);
  }

  getAvailableTables(cafeId: number): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.tableApiUrl}/cafe/${cafeId}/available`);
  }
}
