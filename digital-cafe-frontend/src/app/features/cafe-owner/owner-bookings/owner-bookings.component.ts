import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "@core/services/api.service";
import { AuthService } from "@core/auth/auth.service";
import { Booking, BookingStatus } from "@shared/models/booking.model";

@Component({
  selector: "app-owner-bookings",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="owner-page">
      <header class="page-header">
        <h1>Bookings Overview</h1>
        <p>View and manage all bookings for your cafe.</p>
      </header>

      <div class="stats">
        <article class="card"><small>Total</small><strong>{{ bookings.length }}</strong></article>
        <article class="card"><small>Confirmed</small><strong>{{ countBy('CONFIRMED') }}</strong></article>
        <article class="card"><small>Pending</small><strong>{{ countBy('PENDING') }}</strong></article>
        <article class="card"><small>Completed</small><strong>{{ countBy('COMPLETED') }}</strong></article>
      </div>

      <div class="filter-bar">
        <button
          *ngFor="let f of filters"
          [class.active]="activeFilter === f.value"
          (click)="filterBookings(f.value)">
          {{ f.label }}
        </button>
      </div>

      <div class="empty" *ngIf="filteredBookings.length === 0 && !loading">
        No bookings found.
      </div>

      <div class="grid">
        <article class="card item" *ngFor="let booking of filteredBookings">
          <div class="item-details">
            <h3>{{ booking.bookingNumber || ('Booking #' + booking.id) }}</h3>
            <p>{{ booking.customerName || ('Customer #' + booking.customerId) }}</p>
            <p>Table {{ booking.tableNumber || booking.tableId }} &bull; {{ booking.numberOfGuests }} guests</p>
            <p class="date">{{ booking.bookingDate }} at {{ booking.bookingTime }}</p>
            <p *ngIf="booking.specialRequests" class="note">{{ booking.specialRequests }}</p>
          </div>
          <span class="status" [ngClass]="getStatusClass(booking.status)">{{ booking.status }}</span>
        </article>
      </div>

      <div *ngIf="loading" class="loading-msg">Loading bookings...</div>
    </section>
  `,
  styles: [`
    .owner-page { padding: 1rem; color: #0f172a; }
    .page-header { margin-bottom: 1rem; }
    .page-header h1 { margin: 0; }
    .page-header p { margin: .35rem 0 0; color: #64748b; }
    .stats { display: grid; gap: .8rem; grid-template-columns: repeat(4, minmax(0,1fr)); margin-bottom: 1rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: .9rem; box-shadow: 0 6px 18px rgba(2, 6, 23, .06); }
    .stats small { color: #64748b; font-weight: 600; }
    .stats strong { display: block; margin-top: .2rem; font-size: 1.6rem; }

    .filter-bar { display: flex; gap: .5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .filter-bar button {
      padding: .4rem .85rem; border: 1px solid #e2e8f0; border-radius: 999px;
      background: #fff; color: #64748b; font-size: .85rem; font-weight: 600;
      cursor: pointer; transition: all .2s;
    }
    .filter-bar button.active { background: #1e293b; color: #f8fafc; border-color: #1e293b; }
    .filter-bar button:hover:not(.active) { background: #f1f5f9; }

    .grid { display: grid; gap: .8rem; }
    .item { display: flex; justify-content: space-between; align-items: center; gap: .8rem; }
    .item h3 { margin: 0; }
    .item p { margin: .15rem 0 0; color: #64748b; font-size: .9rem; }
    .item .date { color: #334155; font-weight: 600; }
    .item .note { font-style: italic; font-size: .85rem; }
    .status { flex-shrink: 0; font-size: .8rem; font-weight: 700; padding: .25rem .55rem; border-radius: 999px; }
    .status.confirmed { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.completed { background: #e0f2fe; color: #075985; }
    .status.cancelled { background: #fee2e2; color: #991b1b; }
    .status.no_show { background: #fce7f3; color: #9d174d; }

    .empty, .loading-msg { color: #64748b; padding: 1rem 0; }

    @media (max-width: 900px) { .stats { grid-template-columns: repeat(2, minmax(0,1fr)); } .item { flex-direction: column; align-items: flex-start; } }
    @media (max-width: 640px) { .stats { grid-template-columns: 1fr; } }
  `],
})
export class OwnerBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  cafeId: number | null = null;
  loading = true;
  activeFilter = "ALL";

  filters = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.cafeId = this.authService.currentUserValue?.cafeId || null;
    if (!this.cafeId) {
      this.loading = false;
      return;
    }
    this.apiService.getBookingsByCafe(this.cafeId).subscribe({
      next: (bookings) => {
        this.bookings = (bookings || []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  filterBookings(status: string): void {
    this.activeFilter = status;
    this.applyFilter();
  }

  countBy(status: string): number {
    return this.bookings.filter((b) => String(b.status) === status).length;
  }

  getStatusClass(status: string | BookingStatus): string {
    return String(status).toLowerCase().replace("-", "_");
  }

  private applyFilter(): void {
    if (this.activeFilter === "ALL") {
      this.filteredBookings = this.bookings;
    } else {
      this.filteredBookings = this.bookings.filter(
        (b) => String(b.status) === this.activeFilter,
      );
    }
  }
}
