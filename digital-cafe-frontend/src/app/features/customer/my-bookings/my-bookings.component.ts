import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Booking, BookingStatus } from "@shared/models/booking.model";

@Component({
  selector: "app-my-bookings",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./my-bookings.component.html",
  styleUrls: ["./my-bookings.component.scss"],
})
export class MyBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = true;
  activeFilter: "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED" = "ALL";
  pageIndex = 0;
  readonly pageSize = 9;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = (bookings || []).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  setFilter(filter: "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED"): void {
    this.activeFilter = filter;
    this.pageIndex = 0;
  }

  get filteredBookings(): Booking[] {
    switch (this.activeFilter) {
      case "UPCOMING":
        return this.bookings.filter(
          (b) =>
            b.status === BookingStatus.CONFIRMED ||
            b.status === BookingStatus.BOOKED ||
            b.status === BookingStatus.PENDING,
        );
      case "COMPLETED":
        return this.bookings.filter(
          (b) => b.status === BookingStatus.COMPLETED,
        );
      case "CANCELLED":
        return this.bookings.filter(
          (b) =>
            b.status === BookingStatus.CANCELLED ||
            b.status === BookingStatus.NO_SHOW,
        );
      default:
        return this.bookings;
    }
  }

  get pagedBookings(): Booking[] {
    return this.filteredBookings.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }

  get filteredCount(): number {
    return this.filteredBookings.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCount / this.pageSize));
  }

  get rangeStart(): number {
    return this.filteredCount === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.filteredCount);
  }

  get allPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
  }

  countByStatus(status: string): number {
    return this.bookings.filter((b) => b.status === status).length;
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      BOOKED: "Booked",
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      CANCELLED: "Cancelled",
      COMPLETED: "Completed",
      NO_SHOW: "No Show",
    };
    return map[status] ?? status;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return "—";
    // handles "HH:mm" or "HH:mm:ss"
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${suffix}`;
  }
}
