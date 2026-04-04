import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { CafeContextService } from "../services/cafe-context.service";
import { Booking } from "@shared/models/booking.model";
import { Subscription } from "rxjs";

@Component({
  selector: "app-owner-bookings",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./owner-bookings.component.html",
  styleUrls: ["./owner-bookings.component.scss"],
})
export class OwnerBookingsComponent implements OnInit, OnDestroy {
  bookings: Booking[] = [];
  cafeId: number | null = null;
  loading = false;
  private activeCafeSub?: Subscription;

  pageIndex = 0;
  readonly pageSize = 10;

  get pagedBookings(): Booking[] {
    return this.bookings.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.bookings.length;
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }
  get rangeStart(): number {
    return this.totalElements === 0 ? 0 : this.pageIndex * this.pageSize + 1;
  }
  get rangeEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalElements);
  }
  get allPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }
  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.pageIndex = page;
  }

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private cafeCtx: CafeContextService,
  ) {}

  ngOnInit(): void {
    this.activeCafeSub = this.cafeCtx.activeCafe$.subscribe((cafe) => {
      if (!cafe?.id || cafe.id === this.cafeId) {
        return;
      }
      this.cafeId = cafe.id;
      this.pageIndex = 0;
      this.fetchBookings();
    });

    // Check ?cafeId= query param (navigation from multi-cafe view)
    const queryId = this.route.snapshot.queryParamMap.get("cafeId");
    if (queryId) {
      this.cafeId = +queryId;
      this.fetchBookings();
      return;
    }
    // Use context-selected cafe
    const activeCafe = this.cafeCtx.activeCafe;
    if (activeCafe) {
      this.cafeId = activeCafe.id;
      this.fetchBookings();
      return;
    }
    // Fallback: load owner's primary cafe
    this.apiService.getMyCafe().subscribe({
      next: (cafe) => {
        this.cafeId = cafe.id;
        this.fetchBookings();
      },
      error: () => this.router.navigate(["/owner/cafes"]),
    });
  }

  ngOnDestroy(): void {
    this.activeCafeSub?.unsubscribe();
  }

  fetchBookings(): void {
    if (!this.cafeId) return;
    this.loading = true;
    this.apiService.getBookingsByCafe(this.cafeId).subscribe({
      next: (bookings) => {
        this.bookings = bookings || [];
        this.loading = false;
      },
      error: () => {
        this.bookings = [];
        this.loading = false;
      },
    });
  }

  countBy(status: string): number {
    return this.bookings.filter((b) => String(b.status) === status).length;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      BOOKED: "status-booked",
      CONFIRMED: "status-confirmed",
      CHECKED_IN: "status-checkedin",
      COMPLETED: "status-completed",
      CANCELLED: "status-cancelled",
      NO_SHOW: "status-noshow",
    };
    return map[status?.toUpperCase()] || "status-default";
  }

  formatStatus(status: string): string {
    const value = String(status || "-").trim();
    if (!value || value === "-") return "-";
    return value
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}
