import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map, Observable } from "rxjs";
import { environment } from "@environments/environment";
import {
  PublicCafeCard,
  PublicCafeDetail,
} from "@shared/models/cafe.model";
import { Booking } from "@shared/models/booking.model";
import { Order } from "@shared/models/order.model";
import { Payment } from "@shared/models/payment.model";

interface ApiResponse<T> {
  data?: T;
}

interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({
  providedIn: "root",
})
export class CafeBrowseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPublicCafes(page: number, size: number): Observable<PageResponse<PublicCafeCard>> {
    return this.http
      .get<ApiResponse<any>>(
        `${this.apiUrl}/public/cafes?page=${page}&size=${size}`,
      )
      .pipe(
        map((res) => {
          const payload = res?.data || {};
          const content = Array.isArray(payload?.content) ? payload.content : [];

          return {
            content: content.map((item: any) => ({
              id: item.id,
              name: item.name,
              location: [item.city, item.state].filter(Boolean).join(", "),
              description: item.description || "",
              openTime: item.openTime || "",
              closeTime: item.closeTime || "",
              rating: Number(item.rating || 0),
              imageUrl: item.imageUrl || item.logoUrl || "",
            })),
            pageNumber: Number(payload?.pageNumber ?? page),
            pageSize: Number(payload?.pageSize ?? size),
            totalElements: Number(payload?.totalElements ?? 0),
            totalPages: Number(payload?.totalPages ?? 0),
          } as PageResponse<PublicCafeCard>;
        }),
      );
  }

  getCafeDetails(cafeId: number): Observable<PublicCafeDetail> {
    return this.http
      .get<ApiResponse<any>>(`${this.apiUrl}/public/cafes/${cafeId}`)
      .pipe(
        map((res) => {
          const data = res?.data || {};
          return {
            cafeDetails: {
              id: data.id,
              name: data.name || "",
              location: [data.city, data.state].filter(Boolean).join(", "),
              description: data.description || "",
              openTime: data.openTime || "",
              closeTime: data.closeTime || "",
              rating: Number(data.rating || 0),
              imageUrl: data.coverUrl || data.logoUrl || data.imageUrl || "",
            },
            menuItems: (data.menuItems || []).map((item: any) => ({
              id: item.id,
              name: item.name || "",
              description: item.description || "",
              category: item.category || "OTHER",
              price: Number(item.price || 0),
              imageUrl: item.imageUrl || "",
              available: !!item.available,
            })),
          } as PublicCafeDetail;
        }),
      );
  }

  getTableAvailability(
    cafeId: number,
    date: string,
    timeSlot: string,
    seats?: number,
  ): Observable<Array<{ id: number; tableNumber: string; capacity: number }>> {
    let query = `cafeId=${cafeId}&date=${date}&timeSlot=${encodeURIComponent(timeSlot)}`;
    if (seats && seats > 0) {
      query += `&seats=${seats}`;
    }
    return this.http
      .get<ApiResponse<Array<{ id: number; tableNumber: string; capacity: number }>>>(
        `${this.apiUrl}/tables/available?${query}`,
      )
      .pipe(map((res) => res?.data || []));
  }

  createBooking(payload: {
    cafeId: number;
    date: string;
    timeSlot: string;
    numberOfGuests: number;
  }): Observable<Booking> {
    return this.http
      .post<ApiResponse<Booking>>(`${this.apiUrl}/customer/bookings`, payload)
      .pipe(map((res) => res?.data as Booking));
  }

  createOrder(payload: {
    bookingId: number;
    items: Array<{ menuId: number; quantity: number }>;
  }): Observable<Order> {
    return this.http
      .post<ApiResponse<Order>>(`${this.apiUrl}/customer/orders`, payload)
      .pipe(map((res) => res?.data as Order));
  }

  pay(payload: { orderId: number; paymentMethod: string }): Observable<Payment> {
    return this.http
      .post<ApiResponse<Payment>>(`${this.apiUrl}/customer/payments`, payload)
      .pipe(map((res) => res?.data as Payment));
  }
}
