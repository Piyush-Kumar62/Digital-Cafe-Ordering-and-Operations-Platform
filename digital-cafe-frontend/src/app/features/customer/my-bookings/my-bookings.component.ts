import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Booking } from "@shared/models/booking.model";

@Component({
  selector: "app-my-bookings",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page">
      <header>
        <h1>My Bookings</h1>
        <p>Track your table reservations and status.</p>
      </header>

      <div class="grid" *ngIf="pagedBookings.length; else empty">
        <article class="card" *ngFor="let booking of pagedBookings">
          <h3>{{ booking.bookingNumber || ('Booking #' + booking.id) }}</h3>
          <p>Cafe: {{ booking.cafeName || ('Cafe #' + booking.cafeId) }}</p>
          <p>Date: {{ booking.bookingDate }} {{ booking.bookingTime }}</p>
          <p>Guests: {{ booking.numberOfGuests }}</p>
          <span class="status">{{ booking.status }}</span>
        </article>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button (click)="prevPage()" [disabled]="page === 1">Previous</button>
        <span>Page {{ page }} / {{ totalPages }}</span>
        <button (click)="nextPage()" [disabled]="page === totalPages">Next</button>
      </div>

      <ng-template #empty>
        <div class="empty">
          No bookings found.
          <a routerLink="/customer/cafe">Book a table</a>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .page { padding: 1rem; }
    header h1 { margin: 0; }
    header p { color: #64748b; margin: .4rem 0 1rem; }
    .grid { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: .9rem; }
    .card h3 { margin: 0 0 .4rem; }
    .card p { margin: .25rem 0; color: #475569; }
    .status { display: inline-block; margin-top: .5rem; font-size: .78rem; font-weight: 700; background: #e2e8f0; padding: .2rem .5rem; border-radius: 999px; }
    .pagination { margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: .8rem; }
    .pagination button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: .45rem .7rem; }
    .empty { background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 1rem; }
    .empty a { margin-left: .5rem; color: #2563eb; }
  `],
})
export class MyBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  pagedBookings: Booking[] = [];
  page = 1;
  readonly pageSize = 8;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings || [];
        this.recomputePage();
      },
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.bookings.length / this.pageSize));
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.recomputePage();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      this.recomputePage();
    }
  }

  private recomputePage(): void {
    const start = (this.page - 1) * this.pageSize;
    this.pagedBookings = this.bookings.slice(start, start + this.pageSize);
  }
}
