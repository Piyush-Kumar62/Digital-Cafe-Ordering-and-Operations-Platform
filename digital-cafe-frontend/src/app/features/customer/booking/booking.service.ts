import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Booking, BookingRequest } from '@shared/models/booking.model';
import { environment } from '@environments/environment';
import { Cafe, Table } from '@shared/models/cafe.model';

interface AvailabilityTableDto {
  tableId: number;
  capacity: number;
  isAvailable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingApiUrl = `${environment.apiUrl}/bookings`;
  private tableApiUrl = `${environment.apiUrl}/tables`;
  private cafeApiUrl = `${environment.apiUrl}/cafes`;

  constructor(private http: HttpClient) { }

  createBooking(bookingRequest: BookingRequest): Observable<Booking> {
    return this.http
      .post<{ data?: Booking }>(this.bookingApiUrl, bookingRequest)
      .pipe(map((res) => res?.data as Booking));
  }

  getAvailableTables(cafeId: number, date?: string, timeSlot?: string): Observable<Table[]> {
    if (date && timeSlot) {
      const params = new HttpParams()
        .set('cafeId', String(cafeId))
        .set('date', date)
        .set('timeSlot', timeSlot);
      return this.http
        .get<{ data?: Table[] }>(`${this.tableApiUrl}/available`, { params })
        .pipe(map((res) => res?.data || []));
    }

    return this.http
      .get<{ data?: Table[] }>(`${this.tableApiUrl}/cafe/${cafeId}/available`)
      .pipe(map((res) => res?.data || []));
  }

  getAvailabilityForSlot(cafeId: number, date: string, time: string, seats?: number): Observable<Table[]> {
    let params = new HttpParams()
      .set('cafeId', String(cafeId))
      .set('date', date)
      .set('time', time);
    if (typeof seats === 'number' && seats > 0) {
      params = params.set('seats', String(seats));
    }
    return this.http
      .get<{ data?: AvailabilityTableDto[] }>(`${this.bookingApiUrl}/availability`, { params })
      .pipe(
        map((res) =>
          (res?.data || []).map((item) => ({
            id: item.tableId,
            tableNumber: `Table ${item.tableId}`,
            capacity: item.capacity,
            isAvailable: item.isAvailable,
            cafeId,
          })),
        ),
      );
  }

  getActiveCafes(): Observable<Cafe[]> {
    return this.http
      .get<{ data?: Cafe[] }>(`${this.cafeApiUrl}/active`)
      .pipe(map((res) => res?.data || []));
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http
      .get<{ data?: Booking[] }>(`${this.bookingApiUrl}/my-bookings`)
      .pipe(map((res) => res?.data || []));
  }
}
