import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Booking } from "@shared/models/booking.model";

const SELECTED_CAFE_KEY = "customer_selected_cafe_id";
const ACTIVE_BOOKING_KEY = "customer_active_booking";

@Injectable({
  providedIn: "root",
})
export class CustomerJourneyService {
  private selectedCafeIdSubject = new BehaviorSubject<number | null>(
    this.readSelectedCafeId(),
  );
  selectedCafeId$ = this.selectedCafeIdSubject.asObservable();

  private activeBookingSubject = new BehaviorSubject<Booking | null>(
    this.readActiveBooking(),
  );
  activeBooking$ = this.activeBookingSubject.asObservable();

  getSelectedCafeId(): number | null {
    return this.selectedCafeIdSubject.value;
  }

  setSelectedCafeId(cafeId: number | null): void {
    this.selectedCafeIdSubject.next(cafeId);
    if (cafeId === null) {
      localStorage.removeItem(SELECTED_CAFE_KEY);
      return;
    }
    localStorage.setItem(SELECTED_CAFE_KEY, String(cafeId));
  }

  getActiveBooking(): Booking | null {
    return this.activeBookingSubject.value;
  }

  setActiveBooking(booking: Booking | null): void {
    this.activeBookingSubject.next(booking);
    if (!booking) {
      localStorage.removeItem(ACTIVE_BOOKING_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_BOOKING_KEY, JSON.stringify(booking));
    if (booking.cafeId) {
      this.setSelectedCafeId(booking.cafeId);
    }
  }

  clearJourney(): void {
    this.setActiveBooking(null);
    this.setSelectedCafeId(null);
  }

  private readSelectedCafeId(): number | null {
    const raw = localStorage.getItem(SELECTED_CAFE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private readActiveBooking(): Booking | null {
    const raw = localStorage.getItem(ACTIVE_BOOKING_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Booking;
    } catch {
      return null;
    }
  }
}
