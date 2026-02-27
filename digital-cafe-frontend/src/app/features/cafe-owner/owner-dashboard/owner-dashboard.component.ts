import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "@environments/environment";

import { Chart, registerables } from "chart.js";

/* Register Chart.js once */
Chart.register(...registerables);

/* ================= INTERFACES ================= */

interface Booking {
  id: number;
  customerName: string;
  date: string;
  tableNumber: number;
}

interface Order {
  id: number;
  amount: number;
  status: string;
}

interface InventoryItem {
  name: string;
  remaining: number;
}

/* ================= COMPONENT ================= */

@Component({
  selector: "app-cafe-owner-dashboard",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./owner-dashboard.component.html",
  styleUrls: ["./owner-dashboard.component.scss"]
})
export class CafeOwnerDashboardComponent implements OnInit, AfterViewInit {

  private apiUrl = environment.apiUrl;
  loading = true;
  cafeId!: number;

  /* Canvas References */
  @ViewChild("tableChart") tableChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("ordersChart") ordersChartRef!: ElementRef<HTMLCanvasElement>;

  private tableChart?: Chart;
  private ordersChart?: Chart;

  private viewInitialized = false;

  /* ================= DASHBOARD DATA ================= */

  dashboard = {
    totalTables: 0,
    availableTables: 0,

    totalStaff: 0,
    activeStaff: 0,

    todayOrders: 0,
    pendingOrders: 0,

    todayRevenue: 0,

    upcomingBookings: [] as Booking[],
    recentOrders: [] as Order[],
    lowStockItems: [] as InventoryItem[]
  };

  constructor(private http: HttpClient) {}

  /* ================= LIFECYCLE ================= */

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
  }

  /* ================= LOAD DASHBOARD ================= */
loadDashboard(): void {

  this.loading = true;

  this.http.get<any>(`${this.apiUrl}/cafes/my-cafe`).subscribe({
    next: (res) => {

      this.cafeId = res.data.id;

      // Load ALL data independently
      this.loadTables();
      this.loadStaff();
      this.loadOrders();
      this.loadInventory(); // safe now

      // ✅ STOP LOADING HERE (not inside APIs)
      this.loading = false;
    },

    error: err => {
      console.error("Cafe load failed", err);
      this.loading = false;
    }
  });
}
  /* ================= TABLES ================= */

  private loadTables(): void {

    this.http.get<any>(`${this.apiUrl}/tables/my`).subscribe({
      next: (res) => {

        const tables = res.data || [];

        const total = tables.length;
        const available = tables.filter((t:any)=>t.isAvailable).length;
        const occupied = total - available;

        this.dashboard.totalTables = total;
        this.dashboard.availableTables = available;

        if (this.viewInitialized) {
          this.renderTableChart(available, occupied);
        }
      }
    });
  }

  /* ================= STAFF ================= */

  private loadStaff(): void {

    this.http.get<any>(`${this.apiUrl}/staff/cafe/${this.cafeId}`).subscribe({
      next: (res) => {

        const staff = res.data || [];

        this.dashboard.totalStaff = staff.length;
        this.dashboard.activeStaff =
          staff.filter((s:any)=>s.isActive).length;
      }
    });
  }

  /* ================= ORDERS ================= */

  private loadOrders(): void {

    this.http.get<any>(`${this.apiUrl}/orders/cafe/${this.cafeId}`).subscribe({
      next: (res) => {

        const orders = res.data || [];

        const completed = orders.filter((o:any)=>o.status==="COMPLETED").length;
        const pending = orders.filter((o:any)=>o.status==="PENDING").length;

        this.dashboard.todayOrders = orders.length;
        this.dashboard.pendingOrders = pending;

        this.dashboard.todayRevenue =
          orders.reduce((s:number,o:any)=>s+(o.totalAmount||0),0);

        this.dashboard.recentOrders = orders.slice(0,5);

        if (this.viewInitialized) {
          this.renderOrdersChart(completed, pending);
        }
      }
    });
  }

  /* ================= BOOKINGS (Optional Endpoint) ================= */

  private loadBookings(): void {

    this.http.get<any>(`${this.apiUrl}/bookings/cafe/${this.cafeId}`).subscribe({
      next: (res) => {
        this.dashboard.upcomingBookings = res.data || [];
      },
      error: () => this.dashboard.upcomingBookings = []
    });
  }

  /* ================= INVENTORY (Optional Endpoint) ================= */
private loadInventory(): void {
  // TEMPORARY DISABLED
  this.dashboard.lowStockItems = [];
}

  /* ================= PIE CHART ================= */

  private renderTableChart(available:number, occupied:number): void {

    if (!this.tableChartRef) return;

    this.tableChart?.destroy();

    this.tableChart = new Chart(this.tableChartRef.nativeElement, {
      type: "doughnut",
      data: {
        labels: ["Available", "Occupied"],
        datasets: [{
          data: [available, occupied],
          backgroundColor: ["#22c55e", "#ef4444"]
        }]
      }
    });
  }

  /* ================= BAR CHART ================= */

  private renderOrdersChart(completed:number, pending:number): void {

    if (!this.ordersChartRef) return;

    this.ordersChart?.destroy();

    this.ordersChart = new Chart(this.ordersChartRef.nativeElement, {
      type: "bar",
      data: {
        labels: ["Completed", "Pending"],
        datasets: [{
          label: "Today's Orders",
          data: [completed, pending],
          backgroundColor: ["#6366f1", "#f59e0b"]
        }]
      }
    });
  }

  refresh(): void {
    this.loadDashboard();
  }
}