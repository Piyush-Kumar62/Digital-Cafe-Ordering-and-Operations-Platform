import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, switchMap, of } from 'rxjs';
import { Order, OrderStatus } from '@shared/models/order.model';
import { OrderTrackingService } from './order-tracking.service';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.scss']
})
export class OrderTrackingComponent implements OnInit {
  order$!: Observable<Order | null>;
  orderStatusSteps: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.SERVED
  ];
  OrderStatus = OrderStatus; // Expose enum to template

  constructor(
    private route: ActivatedRoute,
    private orderTrackingService: OrderTrackingService
  ) { }

  ngOnInit(): void {
    this.order$ = this.route.paramMap.pipe(
      switchMap(params => {
        const orderId = Number(params.get('id'));
        if (orderId) {
          // In a real app, you might want to add polling here to get live updates
          return this.orderTrackingService.getOrderById(orderId);
        }
        return of(null);
      })
    );
  }

  getStepStatus(step: OrderStatus, currentStatus: OrderStatus): 'completed' | 'current' | 'upcoming' {
    const currentIndex = this.orderStatusSteps.indexOf(currentStatus);
    const stepIndex = this.orderStatusSteps.indexOf(step);

    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'current';
    } else {
      return 'upcoming';
    }
  }
}
