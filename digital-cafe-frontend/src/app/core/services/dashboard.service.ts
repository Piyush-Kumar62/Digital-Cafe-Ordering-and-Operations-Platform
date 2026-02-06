import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  unverifiedEmails: number;
  incompleteProfiles: number;
  totalCafes: number;
  todayRegistrations: number;
  weeklyGrowth: number[];
  usersByRole: { [key: string]: number };
  recentUsers: RecentUser[];
}

export interface RecentUser {
  id: number;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  createdAt: string;
}

export interface OwnerDashboard {
  totalTables: number;
  totalMenuItems: number;
  todayBookings: number;
  todayOrders: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalChefs: number;
  totalWaiters: number;
  popularItems: PopularItem[];
  revenueChart: RevenueData[];
}

export interface PopularItem {
  menuItemId: number;
  name: string;
  orderCount: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface ChefDashboard {
  pendingOrders: number;
  preparingOrders: number;
  completedTodayOrders: number;
  averagePreparationTime: number;
  orderQueue: OrderSummary[];
}

export interface WaiterDashboard {
  readyOrders: number;
  activeBookings: number;
  servedTodayOrders: number;
  serviceQueue: OrderSummary[];
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  tableNumber: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getAdminDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.apiUrl}/admin`);
  }

  getOwnerDashboard(): Observable<OwnerDashboard> {
    return this.http.get<OwnerDashboard>(`${this.apiUrl}/owner`);
  }

  getChefDashboard(cafeId: number): Observable<ChefDashboard> {
    return this.http.get<ChefDashboard>(`${this.apiUrl}/chef/${cafeId}`);
  }

  getWaiterDashboard(cafeId: number): Observable<WaiterDashboard> {
    return this.http.get<WaiterDashboard>(`${this.apiUrl}/waiter/${cafeId}`);
  }
}
