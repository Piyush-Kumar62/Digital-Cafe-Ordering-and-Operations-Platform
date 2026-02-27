import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "@core/services/api.service";
import { NotificationService } from "@core/services/notification.service";
import { Booking } from "@shared/models/booking.model";
import { Cafe } from "@shared/models/cafe.model";

@Component({
  selector: "app-booking-management",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management-container">
      <div class="toolbar">
        <select [(ngModel)]="selectedCafeId" (change)="loadBookings()">
          <option [ngValue]="null">Select cafe</option>
          <option *ngFor="let cafe of cafes" [ngValue]="cafe.id">{{ cafe.name }}</option>
        </select>
        <span class="meta">Auto refresh: {{ refreshSeconds }}s</span>
      </div>

      <div class="card table-wrap" *ngIf="bookings.length; else emptyState">
        <table>
          <thead>
            <tr>
              <th>Booking</th>
              <th>Customer</th>
              <th>Table</th>
              <th>Date</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let booking of bookings">
              <td>{{ getBookingNumber(booking) }}</td>
              <td>{{ booking.customerName || "-" }}</td>
              <td>{{ booking.tableNumber || "-" }}</td>
              <td>{{ booking.bookingDate }} {{ booking.bookingTime }}</td>
              <td>{{ booking.numberOfGuests }}</td>
              <td>{{ booking.status }}</td>
              <td class="actions">
                <select [(ngModel)]="statusMap[booking.id]">
                  <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
                </select>
                <button class="btn-info" (click)="updateStatus(booking)">Save</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #emptyState>
        <div class="card empty">No bookings found for selected cafe.</div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .management-container { padding: 0; }
      .toolbar { background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border: 1px solid #dbe4f0; border-radius: 14px; padding: 0.75rem; display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); }
      .toolbar select { border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.5rem 0.65rem; min-width: 220px; color: #0f172a; }
      .toolbar select:focus { outline: none; border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.25); }
      .meta { color: #334155; font-size: 0.88rem; font-weight: 700; }
      .card { background: #ffffff; border: 1px solid #dbe4f0; border-radius: 14px; padding: 0.75rem; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .card:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(15, 23, 42, 0.1); }
      .empty { text-align: center; color: #64748b; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; border-bottom: 1px solid #e2e8f0; padding: 0.68rem; color: #0f172a; }
      th { color: #475569; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.04em; }
      tbody tr:hover { background: #f1f5f9; }
      .actions { display: flex; gap: 0.4rem; align-items: center; }
      .actions select { border: 1px solid #cbd5e1; border-radius: 9px; padding: 0.36rem; color: #0f172a; background: #ffffff; }
      button { border: none; border-radius: 9px; padding: 0.4rem 0.62rem; color: #fff; font-size: 0.78rem; cursor: pointer; transition: transform 0.18s ease, box-shadow 0.18s ease; }
      button:hover { transform: translateY(-1px); }
      .btn-info { background: #0ea5e9; }
      @media (max-width: 760px) {
        .toolbar { flex-direction: column; align-items: stretch; }
        .toolbar select { min-width: 0; width: 100%; }
        .meta { text-align: right; }
      }
    `,
  ],
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
    private notificationService: NotificationService,
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
      error: (error) => this.notificationService.error(error?.message || "Failed to load cafes"),
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
        this.notificationService.error(error?.message || "Failed to load bookings");
      },
    });
  }

  updateStatus(booking: Booking): void {
    const status = this.statusMap[booking.id] || booking.status;
    this.apiService.updateBookingStatusForAdmin(booking.id, status).subscribe({
      next: () => {
        this.notificationService.success("Booking status updated.");
        this.loadBookings();
      },
      error: (error) => this.notificationService.error(error?.message || "Status update failed"),
    });
  }

  getBookingNumber(booking: Booking): string {
    const value = (booking as unknown as { bookingNumber?: string }).bookingNumber;
    return value || String(booking.id);
  }
}
