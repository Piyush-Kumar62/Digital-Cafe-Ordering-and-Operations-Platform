import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingService } from './booking.service';
import { Cafe, Table } from '@shared/models/cafe.model';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerJourneyService } from '../customer-journey.service';
import { Subject, forkJoin, interval, of, takeUntil } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WebSocketService } from '@core/websocket/websocket.service';
import { AlertService } from '@core/services/alert.service';

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
  timeSlots: string[] = [];
  disabledTimeSlots = new Set<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private router: Router,
    private route: ActivatedRoute,
    private customerJourneyService: CustomerJourneyService,
    private webSocketService: WebSocketService,
    private alertService: AlertService,
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
        setTimeout(() => this.router.navigate(['/customer/cafe'], { queryParams: { cafeId: booking.cafeId } }), 1200);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.bookingError = true;
        this.errorMessage = err?.error?.message || 'There was a problem with your booking. Please try again.';
        this.alertService.error('Booking Failed', this.errorMessage);
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
        this.buildTimeSlotsForCafe(selectedCafeId);
        if (selectedCafeId > 0) {
          this.webSocketService.subscribeToTableAvailability(selectedCafeId);
        }
        this.refreshSlotAvailability();
        this.loadAvailableTables();
      },
      error: () => {
        this.cafes = [];
      },
    });
  }

  private bindTableRefresh(): void {
    this.bookingForm.get('cafeId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((id) => {
      this.bookingForm.patchValue({ tableId: '', bookingTime: '' }, { emitEvent: false });
      const selectedCafeId = Number(id);
      this.customerJourneyService.setSelectedCafeId(selectedCafeId);
      this.buildTimeSlotsForCafe(selectedCafeId);
      if (selectedCafeId > 0) {
        this.webSocketService.subscribeToTableAvailability(selectedCafeId);
      }
      this.refreshSlotAvailability();
      this.loadAvailableTables();
    });
    this.bookingForm.get('bookingDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshSlotAvailability();
      this.loadAvailableTables();
    });
    this.bookingForm.get('bookingTime')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadAvailableTables());
    this.bookingForm.get('numberOfGuests')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.refreshSlotAvailability();
      this.loadAvailableTables();
    });
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
    if (bookingDate && bookingTime) {
      const seats = Number(this.bookingForm.get('numberOfGuests')?.value) || undefined;
      this.bookingService.getAvailabilityForSlot(cafeId, bookingDate, bookingTime, seats).subscribe({
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
      return;
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

        this.refreshSlotAvailability();
        this.loadAvailableTables(true);
      });
  }

  private buildTimeSlotsForCafe(cafeId: number): void {
    const cafe = this.cafes.find((c) => c.id === cafeId);
    const start = this.normalizeTime(cafe?.openingTime || '09:00');
    const end = this.normalizeTime(cafe?.closingTime || '22:00');
    this.timeSlots = this.generateSlots(start, end, 30);
    this.disabledTimeSlots.clear();
  }

  private refreshSlotAvailability(): void {
    const cafeId = Number(this.bookingForm.get('cafeId')?.value);
    const bookingDate = this.bookingForm.get('bookingDate')?.value;
    const seats = Number(this.bookingForm.get('numberOfGuests')?.value) || undefined;
    if (!cafeId || !bookingDate || this.timeSlots.length === 0) {
      return;
    }

    const checks = this.timeSlots.map((slot) =>
      this.bookingService
        .getAvailabilityForSlot(cafeId, bookingDate, slot, seats)
        .pipe(
          map((tables) => ({ slot, available: (tables || []).length > 0 })),
          catchError(() => of({ slot, available: false })),
        ),
    );

    forkJoin(checks).pipe(takeUntil(this.destroy$)).subscribe((results) => {
      this.disabledTimeSlots = new Set(results.filter((r) => !r.available).map((r) => r.slot));
      const selectedTime = this.bookingForm.get('bookingTime')?.value;
      if (selectedTime && this.disabledTimeSlots.has(selectedTime)) {
        this.bookingForm.patchValue({ bookingTime: '', tableId: '' }, { emitEvent: false });
      }
    });
  }

  private generateSlots(start: string, end: string, stepMinutes: number): string[] {
    const [startH, startM] = start.split(':').map((v) => Number(v));
    const [endH, endM] = end.split(':').map((v) => Number(v));
    if (![startH, startM, endH, endM].every((v) => Number.isFinite(v))) {
      return [];
    }
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const slots: string[] = [];
    for (let t = startTotal; t < endTotal; t += stepMinutes) {
      const hh = String(Math.floor(t / 60)).padStart(2, '0');
      const mm = String(t % 60).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }

  private normalizeTime(value: string): string {
    const match = /^(\d{2}):(\d{2})/.exec(value || '');
    if (!match) {
      return '09:00';
    }
    return `${match[1]}:${match[2]}`;
  }
}
