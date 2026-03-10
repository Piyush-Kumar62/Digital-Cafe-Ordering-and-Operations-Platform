import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { CafeContextService } from "../services/cafe-context.service";
import { Order } from "@shared/models/order.model";
import { Subscription } from "rxjs";

@Component({
  selector: "app-owner-orders",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./owner-orders.component.html",
  styleUrls: ["./owner-orders.component.scss"],
})
export class OwnerOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  cafeId: number | null = null;
  loading = false;
  private activeCafeSub?: Subscription;

  pageIndex = 0;
  readonly pageSize = 10;

  get pagedOrders(): Order[] {
    return this.orders.slice(
      this.pageIndex * this.pageSize,
      (this.pageIndex + 1) * this.pageSize,
    );
  }
  get totalElements(): number {
    return this.orders.length;
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
      this.fetchOrders();
    });

    // Check ?cafeId= query param (navigation from multi-cafe view)
    const queryId = this.route.snapshot.queryParamMap.get("cafeId");
    if (queryId) {
      this.cafeId = +queryId;
      this.fetchOrders();
      return;
    }
    // Use context-selected cafe
    const activeCafe = this.cafeCtx.activeCafe;
    if (activeCafe) {
      this.cafeId = activeCafe.id;
      this.fetchOrders();
      return;
    }
    // Fallback: load via API
    this.apiService.cafeExistsForOwner().subscribe({
      next: (exists) => {
        if (!exists) {
          this.router.navigate(["/owner/setup"]);
          return;
        }
        this.apiService.getMyCafe().subscribe({
          next: (cafe) => {
            this.cafeId = cafe.id;
            this.fetchOrders();
          },
          error: () => this.router.navigate(["/owner/setup"]),
        });
      },
      error: () => this.router.navigate(["/owner/setup"]),
    });
  }

  ngOnDestroy(): void {
    this.activeCafeSub?.unsubscribe();
  }

  fetchOrders(): void {
    if (!this.cafeId) return;
    this.loading = true;
    this.apiService.getOrdersByCafe(this.cafeId).subscribe({
      next: (orders) => {
        this.orders = orders || [];
        this.loading = false;
      },
      error: () => {
        this.orders = [];
        this.loading = false;
      },
    });
  }

  countBy(status: string): number {
    return this.orders.filter((o) => String(o.status) === status).length;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: "status-pending",
      PLACED: "status-pending",
      CONFIRMED: "status-confirmed",
      PREPARING: "status-preparing",
      READY: "status-ready",
      SERVED: "status-served",
      COMPLETED: "status-served",
      CANCELLED: "status-cancelled",
    };
    return map[status?.toUpperCase()] || "status-default";
  }
}
