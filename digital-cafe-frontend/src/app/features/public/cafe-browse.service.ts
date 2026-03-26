import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { map, Observable } from "rxjs";
import { environment } from "@environments/environment";
import { PublicCafeCard, PublicCafeDetail } from "@shared/models/cafe.model";
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
  /** Backend origin — everything before /api */
  private backendBase = this.apiUrl.replace(/\/api$/, "");

  constructor(private http: HttpClient) {}

  /**
   * Converts any image path coming from the backend into a browser-loadable URL:
   *  - Full http/https URL  → use as-is
   *  - /uploads/...          → prefix with backend origin (e.g. http://localhost:8080)
   *  - Absolute filesystem path (Windows C:\ or D:\) → ignore, return ''
   *  - null/empty            → return ''
   */
  resolveImageUrl(src: string | null | undefined): string {
    if (!src) return "";
    // Already a full URL (http, https, data:)
    if (/^(https?:\/\/|data:)/.test(src)) return src;
    // Absolute filesystem path (Windows drive letter or UNC path) — discard
    if (/^[A-Za-z]:[/\\]/.test(src) || src.startsWith("\\\\")) return "";
    // Backend can return frontend-served static paths with a leading slash.
    if (src.startsWith("/assets/")) {
      return src.replace(/^\/+/, "");
    }
    // Frontend Angular asset paths like "assets/cafe/..." — serve as-is from Angular dev server
    if (src.startsWith("assets/")) {
      return src;
    }
    // Relative path starting with / — prefix with backend origin
    if (src.startsWith("/")) return `${this.backendBase}${src}`;
    // Backend-relative uploads path without leading slash.
    if (src.startsWith("uploads/")) return `${this.backendBase}/${src}`;
    // Keep relative asset path values untouched.
    if (src.startsWith("./assets/") || src.startsWith("../assets/")) {
      return src;
    }
    // Unknown relative path — keep as-is.
    return src;
  }

  private toLocation(city: any, state: any, fallback?: any): string {
    if (typeof fallback === "string" && fallback.trim()) {
      return fallback.trim();
    }
    return [city, state]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  getPublicCafes(
    page: number,
    size: number,
  ): Observable<PageResponse<PublicCafeCard>> {
    return this.http
      .get<
        ApiResponse<any>
      >(`${this.apiUrl}/public/cafes?page=${page}&size=${size}`)
      .pipe(
        map((res) => {
          const payload = res?.data || {};
          const content = Array.isArray(payload?.content)
            ? payload.content
            : [];

          return {
            content: content.map((item: any) => ({
              id: item.id,
              name: item.name,
              location: [item.city, item.state].filter(Boolean).join(", "),
              description: item.description || "",
              openTime: item.openTime || "",
              closeTime: item.closeTime || "",
              rating: Number(item.rating || 0),
              imageUrl: this.resolveImageUrl(item.imageUrl || item.logoUrl),
              logoUrl: this.resolveImageUrl(item.logoUrl || item.imageUrl),
              galleryImages: Array.isArray(item.galleryImages)
                ? item.galleryImages
                    .map((img: string) => this.resolveImageUrl(img))
                    .filter(Boolean)
                : [],
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
          const payload = res?.data || {};
          const data = payload?.cafeDetails || payload;
          const galleryRaw = Array.isArray(data?.galleryImages)
            ? data.galleryImages
            : Array.isArray(payload?.galleryImages)
              ? payload.galleryImages
              : [];
          const galleryImages = galleryRaw
            .map((img: string) => this.resolveImageUrl(img))
            .filter(Boolean);

          const openTime =
            data?.openTime || data?.openingTime || payload?.openTime || "";
          const closeTime =
            data?.closeTime || data?.closingTime || payload?.closeTime || "";

          const menuItemsRaw = Array.isArray(payload?.menuItems)
            ? payload.menuItems
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

          return {
            cafeDetails: {
              id: Number(data?.id ?? payload?.id ?? cafeId),
              name: String(data?.name || payload?.name || ""),
              location: this.toLocation(
                data?.city ?? payload?.city,
                data?.state ?? payload?.state,
                data?.location ?? payload?.location,
              ),
              description: String(
                data?.description || payload?.description || "",
              ),
              openTime,
              closeTime,
              rating: Number(data?.rating ?? payload?.rating ?? 0),
              imageUrl: this.resolveImageUrl(
                data?.coverUrl ||
                  payload?.coverUrl ||
                  data?.imageUrl ||
                  payload?.imageUrl ||
                  galleryRaw[0] ||
                  data?.logoUrl ||
                  payload?.logoUrl,
              ),
              logoUrl: this.resolveImageUrl(
                data?.logoUrl || payload?.logoUrl || data?.imageUrl,
              ),
              galleryImages,
            },
            menuItems: menuItemsRaw.map((item: any) => ({
              id: item.id,
              name: item.name || "",
              description: item.description || "",
              category: item.category || "OTHER",
              price: Number(item.price || 0),
              imageUrl: this.resolveImageUrl(item.imageUrl),
              available: item.available ?? item.isAvailable ?? true,
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
      .get<
        ApiResponse<
          Array<{ id: number; tableNumber: string; capacity: number }>
        >
      >(`${this.apiUrl}/tables/available?${query}`, {
        headers: new HttpHeaders({ "x-silent-loading": "true" }),
      })
      .pipe(map((res) => res?.data || []));
  }

  createBooking(payload: {
    cafeId: number;
    tableId: number;
    date: string;
    timeSlot: string;
    numberOfGuests: number;
    specialRequests?: string;
  }): Observable<Booking> {
    const body = {
      cafeId: payload.cafeId,
      tableId: payload.tableId,
      bookingDate: payload.date,
      bookingTime: payload.timeSlot,
      numberOfGuests: payload.numberOfGuests,
      specialRequests: payload.specialRequests,
    };
    return this.http
      .post<ApiResponse<Booking>>(`${this.apiUrl}/bookings`, body)
      .pipe(map((res) => res?.data as Booking));
  }

  createOrder(payload: {
    bookingId: number;
    items: Array<{ menuItemId: number; quantity: number }>;
  }): Observable<Order> {
    return this.http
      .post<ApiResponse<Order>>(`${this.apiUrl}/orders`, payload)
      .pipe(map((res) => res?.data as Order));
  }

  pay(payload: {
    orderId: number;
    amount: number;
    paymentMethod: string;
  }): Observable<Payment> {
    return this.http
      .post<ApiResponse<Payment>>(`${this.apiUrl}/payments`, payload)
      .pipe(map((res) => res?.data as Payment));
  }
}
