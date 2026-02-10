export interface AdminDashboard {
  totalUsers: number;
  totalCafes: number;
  totalOrders: number;
  totalRevenue: number;
  recentUsers: RecentUser[];
  activeOwners: number;
  pendingVerifications: number;
}

export interface OwnerDashboard {
  cafeId: number;
  cafeName: string;
  todayOrders: number;
  todayRevenue: number;
  todayBookings: number;
  pendingOrders: number;
  activeStaff: number;
  totalTables: number;
  popularItems: PopularItem[];
  revenueData: RevenueData[];
}

export interface ChefDashboard {
  cafeId: number;
  cafeName: string;
  pendingOrders: number;
  preparingOrders: number;
  completedToday: number;
  recentOrders: OrderSummary[];
}

export interface WaiterDashboard {
  cafeId: number;
  cafeName: string;
  readyOrders: number;
  activeOrders: number;
  servedToday: number;
  recentOrders: OrderSummary[];
}

export interface RecentUser {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface PopularItem {
  menuItemId: number;
  menuItemName: string;
  orderCount: number;
  totalRevenue: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  tableNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}
