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
  templateUrl: "./booking-management.component.html",
  styleUrls: ["./booking-management.component.scss"],
})
export class BookingManagementComponent implements OnInit, OnDestroy {
  cafes: Cafe[] = [];
  selectedCafeId: number | null = null;
  bookings: Booking[] = [];
  loading = false;
  statusMap: Record<number, string> = {};
  statuses = [
    "BOOKED",
    "PENDING",
    "CONFIRMED",
    "CHECKED_IN",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];
  refreshTimer: any = null;
  refreshSeconds = 15;

  pageIndex = 0;
  readonly pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  get rangeStart(): number {
    return this.totalElements === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }
  get allPages(): number[] {
    return Array.from({ length: Math.max(this.totalPages, 1) }, (_, i) => i);
  }
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
    this.loadBookings();
  }

  constructor(
    private apiService: ApiService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    const saved = Number(localStorage.getItem("admin_refresh_seconds") || 15);
    this.refreshSeconds = Number.isNaN(saved) ? 15 : Math.max(5, saved);
    this.loadCafes();
    this.refreshTimer = setInterval(
      () => this.loadBookings(),
      this.refreshSeconds * 1000,
    );
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
        this.pageIndex = 0;
        this.loadBookings();
      },
      error: (error) =>
        this.alertService.error(error?.message || "Failed to load cafes"),
    });
  }

  loadBookings(): void {
    if (!this.selectedCafeId) return;
    this.loading = true;
    this.apiService
      .getCafeBookingsForAdmin(
        this.selectedCafeId,
        this.pageIndex,
        this.pageSize,
      )
      .subscribe({
        next: (res) => {
          this.bookings = res.content || [];
          this.totalElements = res.totalElements || 0;
          this.totalPages = res.totalPages || 0;
          this.bookings.forEach(
            (b) => (this.statusMap[b.id] = this.statusMap[b.id] || b.status),
          );
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
      error: (error) =>
        this.alertService.error(error?.message || "Status update failed"),
    });
  }

  getBookingNumber(booking: Booking): string {
    const value = (booking as unknown as { bookingNumber?: string })
      .bookingNumber;
    return value || String(booking.id);
  }

  fmtDate(value?: string): string {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
  }

  customerLabel(booking: Booking): string {
    if (booking.customerName && booking.customerName.trim()) {
      return booking.customerName.trim();
    }
    if (booking.customerEmail && booking.customerEmail.trim()) {
      return booking.customerEmail.trim();
    }
    if (booking.customerId) {
      return `Customer #${booking.customerId}`;
    }
    return "Unknown Customer";
  }

  customerEmailLabel(booking: Booking): string {
    if (booking.customerEmail && booking.customerEmail.trim()) {
      return booking.customerEmail.trim();
    }
    return "-";
  }
}
