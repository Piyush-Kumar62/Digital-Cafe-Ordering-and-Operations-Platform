import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { BookingService } from './booking.service';
import { Table } from '@shared/models/cafe.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit {
  bookingForm!: FormGroup;
  availableTables$!: Observable<Table[]>;
  isSubmitting = false;
  bookingSuccess = false;
  bookingError = false;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.bookingForm = this.fb.group({
      cafeId: [1, Validators.required], // Hardcoded cafeId
      tableId: ['', Validators.required],
      bookingDate: ['', Validators.required],
      bookingTime: ['', Validators.required],
      numberOfGuests: ['', [Validators.required, Validators.min(1)]],
      specialRequests: ['']
    });

    this.availableTables$ = this.bookingService.getAvailableTables(1); // Hardcoded cafeId
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
        console.log('Booking successful', booking);
        this.isSubmitting = false;
        this.bookingSuccess = true;
        this.bookingForm.reset({ cafeId: 1 }); // Reset form but keep cafeId
        // Optionally navigate away after a delay
        setTimeout(() => this.router.navigate(['/customer/menu']), 3000);
      },
      error: (err) => {
        console.error('Booking failed', err);
        this.isSubmitting = false;
        this.bookingError = true;
      }
    });
  }
}
