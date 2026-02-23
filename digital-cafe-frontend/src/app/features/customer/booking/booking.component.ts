import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from './booking.service';
import { Cafe, Table } from '@shared/models/cafe.model';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerJourneyService } from '../customer-journey.service';
import { Subject, interval, takeUntil } from 'rxjs';
import { WebSocketService } from '@core/websocket/websocket.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit, OnDestroy {
  bookingForm!: FormGroup;
  cafes: Cafe[] = [];
  availableTables: Table[] = [];
  isSubmitting = false;
  loadingTables = false;
  bookingSuccess = false;
  bookingError = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private router: Router,
    private route: ActivatedRoute,
    private customerJourneyService: CustomerJourneyService,
    private webSocketService: WebSocketService,
  ) { }

  ngOnInit(): void {
    const requestedCafeId = Number(this.route.snapshot.queryParamMap.get('cafeId'));
    const savedCafeId = this.customerJourneyService.getSelectedCafeId();
    const cafeId = Number.isFinite(requestedCafeId) && requestedCafeId > 0
      ? requestedCafeId
      : (savedCafeId || 1);

    this.bookingForm = this.fb.group({
      cafeId: [cafeId, Validators.required],
      tableId: ['', Validators.required],
      bookingDate: ['', Validators.required],
      bookingTime: ['', Validators.required],
      numberOfGuests: ['', [Validators.required, Validators.min(1)]],
      specialRequests: ['']
    });

    this.loadCafes();
    this.bindTableRefresh();
    this.startAvailabilityAutoRefresh();
    this.bindRealtimeAvailabilityRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.bookingSuccess = false;
    this.bookingError = false;

    const formValue = this.bookingForm.value;

    this.bookingService.createBooking(formValue).subscribe({
      next: (booking) => {
        this.isSubmitting = false;
        this.bookingSuccess = true;
        this.customerJourneyService.setActiveBooking(booking);
        this.customerJourneyService.setSelectedCafeId(booking.cafeId);
        this.bookingForm.reset({ cafeId: booking.cafeId });
        setTimeout(() => this.router.navigate(['/customer/menu'], { queryParams: { cafeId: booking.cafeId } }), 1200);
      },
      error: (err) => {
        console.error('Booking failed', err);
        this.isSubmitting = false;
        this.bookingError = true;
        this.errorMessage = err?.error?.message || 'There was a problem with your booking. Please try again.';
      }
    });
  }

  private loadCafes(): void {
    this.bookingService.getActiveCafes().subscribe({
      next: (cafes) => {
        this.cafes = cafes || [];
        const currentCafeId = this.bookingForm.get('cafeId')?.value;
        const exists = this.cafes.some((c) => c.id === Number(currentCafeId));
        if (!exists && this.cafes.length) {
          const firstCafeId = this.cafes[0].id;
          this.bookingForm.patchValue({ cafeId: firstCafeId, tableId: '' });
          this.customerJourneyService.setSelectedCafeId(firstCafeId);
        }
        const selectedCafeId = Number(this.bookingForm.get('cafeId')?.value);
        if (selectedCafeId > 0) {
          this.webSocketService.subscribeToTableAvailability(selectedCafeId);
        }
        this.loadAvailableTables();
      },
      error: () => {
        this.cafes = [];
      },
    });
  }

  private bindTableRefresh(): void {
    this.bookingForm.get('cafeId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((id) => {
      this.bookingForm.patchValue({ tableId: '' }, { emitEvent: false });
      const selectedCafeId = Number(id);
      this.customerJourneyService.setSelectedCafeId(selectedCafeId);
      if (selectedCafeId > 0) {
        this.webSocketService.subscribeToTableAvailability(selectedCafeId);
      }
      this.loadAvailableTables();
    });
    this.bookingForm.get('bookingDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadAvailableTables());
    this.bookingForm.get('bookingTime')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadAvailableTables());
  }

  private loadAvailableTables(silent: boolean = false): void {
    const cafeId = Number(this.bookingForm.get('cafeId')?.value);
    if (!cafeId) {
      this.availableTables = [];
      return;
    }

    const bookingDate = this.bookingForm.get('bookingDate')?.value || undefined;
    const bookingTime = this.bookingForm.get('bookingTime')?.value || undefined;

    if (!silent) {
      this.loadingTables = true;
    }
    this.bookingService.getAvailableTables(cafeId, bookingDate, bookingTime).subscribe({
      next: (tables) => {
        this.availableTables = tables || [];
        if (!silent) {
          this.loadingTables = false;
        }
      },
      error: () => {
        if (!silent) {
          this.availableTables = [];
          this.loadingTables = false;
        }
      },
    });
  }

  private startAvailabilityAutoRefresh(): void {
    interval(10000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      const cafeId = Number(this.bookingForm.get('cafeId')?.value);
      const bookingDate = this.bookingForm.get('bookingDate')?.value;
      const bookingTime = this.bookingForm.get('bookingTime')?.value;
      if (!cafeId || !bookingDate || !bookingTime || this.isSubmitting) {
        return;
      }
      this.loadAvailableTables(true);
    });
  }

  private bindRealtimeAvailabilityRefresh(): void {
    this.webSocketService.tableAvailabilityUpdates$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (!event) {
          return;
        }
        const selectedCafeId = Number(this.bookingForm.get('cafeId')?.value);
        const bookingDate = this.bookingForm.get('bookingDate')?.value;
        const bookingTime = this.bookingForm.get('bookingTime')?.value;
        if (!selectedCafeId || !bookingDate || !bookingTime || this.isSubmitting) {
          return;
        }
        if (Number(event.cafeId) !== selectedCafeId) {
          return;
        }
        if (String(event.bookingDate) !== String(bookingDate)) {
          return;
        }

        this.loadAvailableTables(true);
      });
  }
}
