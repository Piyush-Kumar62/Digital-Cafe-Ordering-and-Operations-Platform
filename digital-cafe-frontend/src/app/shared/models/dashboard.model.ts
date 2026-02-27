export interface AdminDashboard {
  // User Statistics
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  unverifiedEmailUsers: number;
  usersWithoutPasswordReset: number;
  todayNewRegistrations: number;

  // Cafe Statistics
  totalCafes: number;
  activeCafes: number;
  inactiveCafes: number;

  // Booking Statistics
  totalBookings: number;
  todayBookings: number;
  thisWeekBookings: number;
  thisMonthBookings: number;

  // Order Statistics
  totalOrders: number;
  todayOrders: number;
  thisWeekOrders: number;
  thisMonthOrders: number;
  pendingOrders: number;
  processingOrders: number;
  readyOrders: number;
  completedOrders: number;
  cancelledOrders: number;

  // Revenue Statistics
  totalRevenue: number;
  todayRevenue: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;

  // Chart Data
  usersByRole: { [key: string]: number };
  weeklyGrowth: WeeklyGrowthData[];
  recentActivities: ActivityData[];

  // Legacy fields (keep for backward compatibility)
  recentUsers?: RecentUser[];
  activeOwners?: number;
  pendingVerifications?: number;
}

export interface WeeklyGrowthData {
  date: string;
  usersCount?: number;
  ordersCount?: number;
  bookingsCount?: number;
  revenue?: number;
  // Backend response fields
  newUsers?: number;
  newOrders?: number;
  newBookings?: number;
}

export interface ActivityData {
  type?: string; // For backward compatibility
  activityType?: string; // Backend uses this field
  description: string;
  timestamp: string;
  userRole?: string; // Additional field from backend
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
