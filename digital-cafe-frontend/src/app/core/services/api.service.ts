import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import {
  Cafe,
  CreateCafeRequest,
  Table,
  MenuItem,
  MenuItemRequest,
} from "@shared/models/cafe.model";
import {
  Order,
  OrderRequest,
  Booking,
  BookingRequest,
} from "@shared/models/order.model";
import { Payment, PaymentRequest } from "@shared/models/payment.model";
import {
  Profile,
  ProfileUpdateRequest,
  AcademicInfo,
  WorkExperience,
} from "@shared/models/profile.model";
import {
  AdminDashboard,
  OwnerDashboard,
  ChefDashboard,
  WaiterDashboard,
} from "@shared/models/dashboard.model";
import { MessageResponse, User } from "@shared/models/auth.model";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ============ Cafe APIs ============
  getAllCafes(): Observable<Cafe[]> {
    return this.http.get<Cafe[]>(`${this.baseUrl}/cafes`);
  }

  getCafeById(id: number): Observable<Cafe> {
    return this.http.get<Cafe>(`${this.baseUrl}/cafes/${id}`);
  }

  getActiveCafes(): Observable<Cafe[]> {
    return this.http.get<Cafe[]>(`${this.baseUrl}/cafes/active`);
  }

  getCafesByCity(city: string): Observable<Cafe[]> {
    return this.http.get<Cafe[]>(`${this.baseUrl}/cafes/city/${city}`);
  }

  createCafe(request: CreateCafeRequest): Observable<Cafe> {
    return this.http.post<Cafe>(`${this.baseUrl}/cafes`, request);
  }

  updateCafe(id: number, request: CreateCafeRequest): Observable<Cafe> {
    return this.http.put<Cafe>(`${this.baseUrl}/cafes/${id}`, request);
  }

  deleteCafe(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/cafes/${id}`);
  }

  // ============ Table APIs ============
  getAllTables(): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.baseUrl}/tables`);
  }

  getTableById(id: number): Observable<Table> {
    return this.http.get<Table>(`${this.baseUrl}/tables/${id}`);
  }

  getTablesByCafe(cafeId: number): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.baseUrl}/tables/cafe/${cafeId}`);
  }

  getAvailableTablesByCafe(cafeId: number): Observable<Table[]> {
    return this.http.get<Table[]>(
      `${this.baseUrl}/tables/cafe/${cafeId}/available`,
    );
  }

  createTable(cafeId: number, table: Partial<Table>): Observable<Table> {
    return this.http.post<Table>(
      `${this.baseUrl}/tables/cafe/${cafeId}`,
      table,
    );
  }

  updateTable(id: number, table: Partial<Table>): Observable<Table> {
    return this.http.put<Table>(`${this.baseUrl}/tables/${id}`, table);
  }

  deleteTable(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/tables/${id}`);
  }

  // ============ Menu Item APIs ============
  getAllMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.baseUrl}/menu-items`);
  }

  getMenuItemById(id: number): Observable<MenuItem> {
    return this.http.get<MenuItem>(`${this.baseUrl}/menu-items/${id}`);
  }

  getMenuItemsByCafe(cafeId: number): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${this.baseUrl}/menu-items/cafe/${cafeId}`,
    );
  }

  getAvailableMenuItemsByCafe(cafeId: number): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${this.baseUrl}/menu-items/cafe/${cafeId}/available`,
    );
  }

  getMenuItemsByCategory(
    cafeId: number,
    category: string,
  ): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(
      `${this.baseUrl}/menu-items/cafe/${cafeId}/category/${category}`,
    );
  }

  createMenuItem(
    cafeId: number,
    request: MenuItemRequest,
  ): Observable<MenuItem> {
    return this.http.post<MenuItem>(
      `${this.baseUrl}/menu-items/cafe/${cafeId}`,
      request,
    );
  }

  updateMenuItem(id: number, request: MenuItemRequest): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/menu-items/${id}`, request);
  }

  deleteMenuItem(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.baseUrl}/menu-items/${id}`,
    );
  }

  // ============ Order APIs ============
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}`);
  }

  getOrdersByCafe(cafeId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders/cafe/${cafeId}`);
  }

  getOrdersByCustomer(customerId: number): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.baseUrl}/orders/customer/${customerId}`,
    );
  }

  getOrdersByStatus(cafeId: number, status: string): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.baseUrl}/orders/cafe/${cafeId}/status/${status}`,
    );
  }

  createOrder(request: OrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, request);
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${id}/status`, null, {
      params: { status },
    });
  }

  cancelOrder(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/orders/${id}`);
  }

  // ============ Booking APIs ============
  getAllBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/bookings`);
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/bookings/${id}`);
  }

  getBookingsByCafe(cafeId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/bookings/cafe/${cafeId}`);
  }

  getBookingsByCustomer(customerId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.baseUrl}/bookings/customer/${customerId}`,
    );
  }

  createBooking(request: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.baseUrl}/bookings`, request);
  }

  updateBookingStatus(id: number, status: string): Observable<Booking> {
    return this.http.put<Booking>(
      `${this.baseUrl}/bookings/${id}/status`,
      null,
      {
        params: { status },
      },
    );
  }

  cancelBooking(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/bookings/${id}`);
  }

  // ============ Payment APIs ============
  createPayment(request: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/payments`, request);
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/payments/${id}`);
  }

  getPaymentByOrder(orderId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/payments/order/${orderId}`);
  }

  // ============ Profile APIs ============
  getProfile(userId: number): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/profiles/${userId}`);
  }

  updateProfile(
    userId: number,
    request: ProfileUpdateRequest,
  ): Observable<Profile> {
    return this.http.put<Profile>(
      `${this.baseUrl}/profiles/${userId}`,
      request,
    );
  }

  addAcademicInfo(userId: number, info: AcademicInfo): Observable<Profile> {
    return this.http.post<Profile>(
      `${this.baseUrl}/profiles/${userId}/academic`,
      info,
    );
  }

  addWorkExperience(
    userId: number,
    experience: WorkExperience,
  ): Observable<Profile> {
    return this.http.post<Profile>(
      `${this.baseUrl}/profiles/${userId}/work-experience`,
      experience,
    );
  }

  // ============ Dashboard APIs ============
  getAdminDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(
      `${this.baseUrl}/admin/dashboard/stats`,
    );
  }

  getOwnerDashboard(cafeId: number): Observable<OwnerDashboard> {
    return this.http.get<OwnerDashboard>(
      `${this.baseUrl}/dashboard/owner/${cafeId}`,
    );
  }

  getChefDashboard(cafeId: number): Observable<ChefDashboard> {
    return this.http.get<ChefDashboard>(
      `${this.baseUrl}/dashboard/chef/${cafeId}`,
    );
  }

  getWaiterDashboard(cafeId: number): Observable<WaiterDashboard> {
    return this.http.get<WaiterDashboard>(
      `${this.baseUrl}/dashboard/waiter/${cafeId}`,
    );
  }

  // ============ User Management APIs ============
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/${id}`);
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users/role/${role}`);
  }

  createCafeOwner(request: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/users/create-cafe-owner`,
      request,
    );
  }

  createChef(cafeId: number, request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/create-chef`, request, {
      params: { cafeId: cafeId.toString() },
    });
  }

  createWaiter(cafeId: number, request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users/create-waiter`, request, {
      params: { cafeId: cafeId.toString() },
    });
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${id}`, user);
  }

  deleteUser(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/users/${id}`);
  }

  toggleUserStatus(id: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(
      `${this.baseUrl}/users/${id}/toggle-status`,
      null,
    );
  }
}
