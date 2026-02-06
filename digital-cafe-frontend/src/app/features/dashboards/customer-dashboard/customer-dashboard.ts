import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService, Booking } from '../../../core/services/booking.service';
import { OrderService } from '../../../core/services/order.service';
import { ProfileService } from '../../../core/services/profile.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order, OrderItem } from '../../../shared/models/order.model';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-dashboard.html',
  styleUrls: ['./customer-dashboard.css'],
})
export class CustomerDashboardComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Dashboard data
  upcomingBookings: Booking[] = [];
  recentOrders: Order[] = [];
  activeOrder: Order | null = null;
  profileCompletion = 0;

  // Stats
  totalBookings = 0;
  totalOrders = 0;
  totalSpent = 0;

  // Order status steps
  orderStatusSteps = [
    { status: 'PLACED', label: 'Order Placed', icon: 'bi-receipt' },
    { status: 'CONFIRMED', label: 'Confirmed', icon: 'bi-check-circle' },
    { status: 'PREPARING', label: 'Preparing', icon: 'bi-fire' },
    { status: 'READY', label: 'Ready', icon: 'bi-box-seam' },
    { status: 'SERVED', label: 'Served', icon: 'bi-cup-straw' },
    { status: 'COMPLETED', label: 'Completed', icon: 'bi-check2-all' },
  ];

  constructor(
    private bookingService: BookingService,
    private orderService: OrderService,
    private profileService: ProfileService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load upcoming bookings
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        const now = new Date();
        this.upcomingBookings = bookings
          .filter((b: Booking) => b.status === 'CONFIRMED' && new Date(b.bookingDate) >= now)
          .sort(
            (a: Booking, b: Booking) =>
              new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime(),
          )
          .slice(0, 5);
        this.totalBookings = bookings.length;
      },
      error: (error) => {
        console.error('Failed to load bookings:', error);
      },
    });

    // Load orders
    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.recentOrders = orders
          .sort(
            (a: Order, b: Order) =>
              new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime(),
          )
          .slice(0, 10);

        // Find active order (not completed or cancelled)
        this.activeOrder =
          orders.find((o: Order) => !['COMPLETED', 'CANCELLED'].includes(o.status)) || null;

        this.totalOrders = orders.length;
        this.totalSpent = orders
          .filter((o: Order) => o.status === 'COMPLETED')
          .reduce((sum: number, o: Order) => sum + o.totalAmount, 0);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load orders:', error);
        this.errorMessage = 'Failed to load dashboard data';
        this.isLoading = false;
      },
    });

    // Load profile completion
    this.profileService.getCompletionPercentage().subscribe({
      next: (completion) => {
        this.profileCompletion = completion.percentage;
      },
      error: (error) => {
        console.error('Failed to load profile completion:', error);
      },
    });
  }

  getStatusStepClass(stepStatus: string): string {
    if (!this.activeOrder) return '';

    const currentIndex = this.orderStatusSteps.findIndex(
      (s) => s.status === this.activeOrder!.status,
    );
    const stepIndex = this.orderStatusSteps.findIndex((s) => s.status === stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      PLACED: 'badge-secondary',
      CONFIRMED: 'badge-info',
      PREPARING: 'badge-warning',
      READY: 'badge-primary',
      SERVED: 'badge-success',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger',
    };
    return statusMap[status] || 'badge-secondary';
  }

  getBookingStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-success',
      CANCELLED: 'badge-danger',
      COMPLETED: 'badge-info',
    };
    return statusMap[status] || 'badge-secondary';
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toFixed(2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  cancelBooking(bookingId: number | undefined): void {
    if (!bookingId) {
      this.errorMessage = 'Invalid booking ID';
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    this.bookingService.updateBookingStatus(bookingId, 'CANCELLED').subscribe({
      next: () => {
        this.successMessage = 'Booking cancelled successfully';
        this.loadDashboard();
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (error) => {
        this.errorMessage = 'Failed to cancel booking';
        console.error('Cancel booking error:', error);
      },
    });
  }

  trackOrder(orderId: number): void {
    // Navigate to order tracking page (to be implemented)
    console.log('Track order:', orderId);
  }
}
