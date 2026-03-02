import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Booking } from "@shared/models/booking.model";

@Component({
  selector: "app-my-bookings",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.scss'],
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
