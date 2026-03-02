import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { AlertService } from "@core/services/alert.service";
import { Booking } from "@shared/models/booking.model";
import { Cafe } from "@shared/models/cafe.model";

@Component({
  selector: "app-booking-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-management.component.html',
  styleUrls: ['./booking-management.component.scss'],
})
export class BookingManagementComponent implements OnInit, OnDestroy {
  cafes: Cafe[] = [];
  selectedCafeId: number | null = null;
  bookings: Booking[] = [];
  loading = false;
  statusMap: Record<number, string> = {};
  statuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
  refreshTimer: any = null;
  refreshSeconds = 15;

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const saved = Number(localStorage.getItem("admin_refresh_seconds") || 15);
    this.refreshSeconds = Number.isNaN(saved) ? 15 : Math.max(5, saved);
    this.loadCafes();
    this.refreshTimer = setInterval(() => this.loadBookings(), this.refreshSeconds * 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  loadCafes(): void {
    this.apiService.getAdminCafes(0, 200).subscribe({
      next: (res) => {
        this.cafes = res.content || [];
        if (!this.selectedCafeId && this.cafes.length) {
          this.selectedCafeId = this.cafes[0].id;
        }
        this.loadBookings();
      },
      error: (error) => this.alertService.error(error?.message || "Failed to load cafes"),
    });
  }

  loadBookings(): void {
    if (!this.selectedCafeId) return;
    this.loading = true;
    this.apiService.getCafeBookingsForAdmin(this.selectedCafeId, 0, 200).subscribe({
      next: (res) => {
        this.bookings = res.content || [];
        this.bookings.forEach((b) => (this.statusMap[b.id] = this.statusMap[b.id] || b.status));
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.alertService.error(error?.message || "Failed to load bookings");
      },
    });
  }

  updateStatus(booking: Booking): void {
    const status = this.statusMap[booking.id] || booking.status;
    this.apiService.updateBookingStatusForAdmin(booking.id, status).subscribe({
      next: () => {
        this.alertService.success("Booking status updated.");
        this.loadBookings();
      },
      error: (error) => this.alertService.error(error?.message || "Status update failed"),
    });
  }

  getBookingNumber(booking: Booking): string {
    const value = (booking as unknown as { bookingNumber?: string }).bookingNumber;
    return value || String(booking.id);
  }
}


