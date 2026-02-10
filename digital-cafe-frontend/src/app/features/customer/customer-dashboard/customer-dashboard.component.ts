import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { AuthService } from '@core/auth/auth.service';
import { CardComponent } from '@shared/components/card/card.component';
import { Cafe } from '@shared/models/cafe.model';
import { Booking } from '@shared/models/order.model';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Welcome, {{ userName }}!</h1>
        <p>Discover and order from amazing cafés</p>
      </div>

      <div class="quick-actions">
        <button class="action-card" routerLink="/customer/cafes">
          <div class="action-icon">🏪</div>
          <h3>Browse Cafés</h3>
          <p>Explore nearby cafés</p>
        </button>
        <button class="action-card" routerLink="/customer/bookings">
          <div class="action-icon">📅</div>
          <h3>My Bookings</h3>
          <p>View reservations</p>
        </button>
        <button class="action-card" routerLink="/customer/orders">
          <div class="action-icon">📦</div>
          <h3>My Orders</h3>
          <p>Track your orders</p>
        </button>
        <button class="action-card" routerLink="/customer/profile">
          <div class="action-icon">👤</div>
          <h3>Profile</h3>
          <p>Manage your account</p>
        </button>
      </div>

      <!-- Featured Cafés -->
      <app-card title="Featured Cafés">
        <div *ngIf="loadingCafes" class="loading">Loading cafés...</div>
        <div class="cafes-grid">
          <div *ngFor="let cafe of cafes" class="cafe-card" (click)="viewCafe(cafe.id)">
            <div class="cafe-image">
              <img [src]="getCafeImage(cafe)" [alt]="cafe.name" />
              <div class="cafe-rating">⭐ {{ cafe.rating.toFixed(1) }}</div>
            </div>
            <div class="cafe-info">
              <h3>{{ cafe.name }}</h3>
              <p class="cafe-location">📍 {{ cafe.city }}, {{ cafe.state }}</p>
              <p class="cafe-hours">🕐 {{ cafe.openingTime }} - {{ cafe.closingTime }}</p>
            </div>
          </div>
        </div>
      </app-card>

      <!-- Recent Bookings -->
      <app-card title="Recent Bookings" *ngIf="bookings.length > 0">
        <div class="bookings-list">
          <div *ngFor="let booking of bookings" class="booking-item">
            <div class="booking-info">
              <h4>{{ booking.cafeName }}</h4>
              <p>{{ booking.bookingDate | date }} at {{ booking.bookingTime }}</p>
              <span class="badge" [class]="'badge-' + booking.status.toLowerCase()">
                {{ booking.status }}
              </span>
            </div>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .dashboard-header {
        margin-bottom: 2rem;

        h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        p {
          color: #6b7280;
        }
      }

      .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
      }

      .action-card {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

        &:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
          border-color: #667eea;
        }

        .action-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        p {
          color: #6b7280;
          font-size: 0.875rem;
        }
      }

      .cafes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
      }

      .cafe-card {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;
        border: 1px solid #e5e7eb;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
      }

      .cafe-image {
        position: relative;
        height: 160px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cafe-rating {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 0.375rem 0.75rem;
          border-radius: 16px;
          font-weight: 600;
          font-size: 0.875rem;
        }
      }

      .cafe-info {
        padding: 1rem;

        h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        p {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0.25rem 0;
        }
      }

      .bookings-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .booking-item {
        padding: 1rem;
        background-color: #f9fafb;
        border-radius: 8px;
        border-left: 4px solid #667eea;

        h4 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        p {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
      }

      @media (max-width: 768px) {
        .dashboard-container {
          padding: 1rem;
        }

        .quick-actions {
          grid-template-columns: repeat(2, 1fr);
        }

        .cafes-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CustomerDashboardComponent implements OnInit {
  userName = '';
  cafes: Cafe[] = [];
  bookings: Booking[] = [];
  loadingCafes = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.firstName || user.username;
      this.loadData();
    }
  }

  loadData(): void {
    // Load featured cafés
    this.apiService.getActiveCafes().subscribe({
      next: (cafes) => {
        this.cafes = cafes.slice(0, 6);
        this.loadingCafes = false;
      },
      error: (error) => {
        console.error('Error loading cafés:', error);
        this.loadingCafes = false;
      },
    });

    // Load user bookings
    const user = this.authService.currentUserValue;
    if (user) {
      this.apiService.getBookingsByCustomer(user.id).subscribe({
        next: (bookings) => {
          this.bookings = bookings.slice(0, 5);
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
        },
      });
    }
  }

  getCafeImage(cafe: Cafe): string {
    return cafe.imageUrl || 'https://via.placeholder.com/280x160?text=Cafe';
  }

  viewCafe(cafeId: number): void {
    // Navigate to café details
  }
}
