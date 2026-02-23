import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "@environments/environment";
import {
  Cafe,
  CreateCafeRequest,
  Table,
} from "@shared/models/cafe.model";
import {
  MenuItem,
  MenuItemRequest,
} from "@shared/models/menu.model";
import {
  Order,
  OrderRequest,
} from "@shared/models/order.model";
import {
  Booking,
  BookingRequest,
} from "@shared/models/booking.model";
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
    return this.http
      .get<{ data?: Cafe[] }>(`${this.baseUrl}/cafes/active`)
      .pipe(map((res: any) => res?.data || []));
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
    return this.http
      .get<any>(`${this.baseUrl}/tables`)
      .pipe(map((res: any) => res?.data || res || []));
  }

  getTableById(id: number): Observable<Table> {
    return this.http
      .get<any>(`${this.baseUrl}/tables/${id}`)
      .pipe(map((res: any) => res?.data || res));
  }

  getTablesByCafe(cafeId: number): Observable<Table[]> {
    return this.http
      .get<any>(`${this.baseUrl}/tables/cafe/${cafeId}`)
      .pipe(map((res: any) => res?.data || res || []));
  }

  getAvailableTablesByCafe(cafeId: number): Observable<Table[]> {
    return this.http
      .get<any>(`${this.baseUrl}/tables/cafe/${cafeId}/available`)
      .pipe(map((res: any) => res?.data || res || []));
  }

  createTable(cafeId: number, table: Partial<Table>): Observable<Table> {
    return this.http
      .post<any>(`${this.baseUrl}/tables/cafe/${cafeId}`, table)
      .pipe(map((res: any) => res?.data || res));
  }

  updateTable(id: number, table: Partial<Table>): Observable<Table> {
    return this.http
      .put<any>(`${this.baseUrl}/tables/${id}`, table)
      .pipe(map((res: any) => res?.data || res));
  }

  deleteTable(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/tables/${id}`);
  }

  toggleTableStatus(id: number, isAvailable: boolean): Observable<Table> {
    const params = new HttpParams().set("isAvailable", String(isAvailable));
    return this.http
      .patch<any>(`${this.baseUrl}/tables/${id}/availability`, null, { params })
      .pipe(map((res: any) => res?.data || res));
  }

  // ============ Menu Item APIs ============
  getAllMenuItems(): Observable<MenuItem[]> {
    return this.http
      .get<any>(`${this.baseUrl}/menu-items`)
      .pipe(map((res: any) => res?.data || res || []));
  }

  getMenuItemById(id: number): Observable<MenuItem> {
    return this.http
      .get<any>(`${this.baseUrl}/menu-items/${id}`)
      .pipe(map((res: any) => res?.data || res));
  }

  getMenuItemsByCafe(cafeId: number): Observable<MenuItem[]> {
    return this.http
      .get<any>(`${this.baseUrl}/menu-items/cafe/${cafeId}`)
      .pipe(map((res: any) => res?.data || res || []));
  }

  getAvailableMenuItemsByCafe(cafeId: number): Observable<MenuItem[]> {
    return this.http
      .get<any>(`${this.baseUrl}/menu-items/cafe/${cafeId}/available`)
      .pipe(map((res: any) => res?.data || res || []));
  }

  getMenuItemsByCategory(
    cafeId: number,
    category: string,
  ): Observable<MenuItem[]> {
    return this.http
      .get<any>(`${this.baseUrl}/menu-items/cafe/${cafeId}/category/${category}`)
      .pipe(map((res: any) => res?.data || res || []));
  }

  createMenuItem(
    cafeId: number,
    request: MenuItemRequest,
  ): Observable<MenuItem> {
    return this.http
      .post<any>(`${this.baseUrl}/menu-items/cafe/${cafeId}`, request)
      .pipe(map((res: any) => res?.data || res));
  }

  updateMenuItem(id: number, request: MenuItemRequest): Observable<MenuItem> {
    return this.http
      .put<any>(`${this.baseUrl}/menu-items/${id}`, request)
      .pipe(map((res: any) => res?.data || res));
  }

  toggleMenuItemAvailability(id: number, isAvailable: boolean): Observable<MenuItem> {
    const params = new HttpParams().set("isAvailable", String(isAvailable));
    return this.http
      .patch<any>(`${this.baseUrl}/menu-items/${id}/availability`, null, { params })
      .pipe(map((res: any) => res?.data || res));
  }

  deleteMenuItem(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.baseUrl}/menu-items/${id}`,
    );
  }

  // ============ Order APIs ============
  getAllOrders(): Observable<Order[]> {
    return this.http
      .get<any>(`${this.baseUrl}/orders`)
      .pipe(map((res: any) => res?.data?.content || res?.data || res || []));
  }

  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}`);
  }

  getOrdersByCafe(cafeId: number): Observable<Order[]> {
    return this.http
      .get<any>(`${this.baseUrl}/orders/cafe/${cafeId}`)
      .pipe(map((res: any) => res?.data?.content || res?.data || res || []));
  }

  getOrdersByCustomer(customerId: number): Observable<Order[]> {
    return this.http.get<Order[]>(
      `${this.baseUrl}/orders/customer/${customerId}`,
    );
  }

  getMyOrders(): Observable<Order[]> {
    return this.http
      .get<any>(`${this.baseUrl}/orders/my-orders`)
      .pipe(map((res: any) => res?.data || []));
  }

  getReadyOrdersForWaiter(): Observable<Order[]> {
    return this.http
      .get<any>(`${this.baseUrl}/orders/waiter/ready`)
      .pipe(map((res: any) => res?.data || []));
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
    return this.http
      .get<any>(`${this.baseUrl}/bookings`)
      .pipe(map((res: any) => res?.data?.content || res?.data || res || []));
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/bookings/${id}`);
  }

  getBookingsByCafe(cafeId: number): Observable<Booking[]> {
    return this.http
      .get<any>(`${this.baseUrl}/bookings/cafe/${cafeId}`)
      .pipe(map((res: any) => res?.data?.content || res?.data || res || []));
  }

  getBookingsByCustomer(customerId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.baseUrl}/bookings/customer/${customerId}`,
    );
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http
      .get<any>(`${this.baseUrl}/bookings/my-bookings`)
      .pipe(map((res: any) => res?.data || []));
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

  getAdminCafes(
    page: number = 0,
    size: number = 100,
    sortBy: string = "name",
    sortDirection: "ASC" | "DESC" = "ASC",
  ): Observable<{
    content: Cafe[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString())
      .set("sortBy", sortBy)
      .set("sortDirection", sortDirection);

    return this.http
      .get<{ data?: any }>(`${this.baseUrl}/cafes`, { params })
      .pipe(
        map((res: any) => res?.data || { content: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: size }),
      );
  }

  toggleCafeStatus(cafeId: number, isActive: boolean): Observable<Cafe> {
    const params = new HttpParams().set("isActive", String(isActive));
    return this.http
      .patch<{ data?: Cafe }>(`${this.baseUrl}/cafes/${cafeId}/status`, null, { params })
      .pipe(map((res: any) => res?.data));
  }

  deleteCafeByAdmin(cafeId: number): Observable<void> {
    return this.http
      .delete<{ data?: void }>(`${this.baseUrl}/cafes/${cafeId}`)
      .pipe(map(() => void 0));
  }

  getCafeOrdersForAdmin(
    cafeId: number,
    page: number = 0,
    size: number = 100,
    sortBy: string = "createdAt",
    sortDirection: "ASC" | "DESC" = "DESC",
  ): Observable<{
    content: Order[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString())
      .set("sortBy", sortBy)
      .set("sortDirection", sortDirection);
    return this.http
      .get<{ data?: any }>(`${this.baseUrl}/orders/cafe/${cafeId}`, { params })
      .pipe(
        map((res: any) => res?.data || { content: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: size }),
      );
  }

  getCafeBookingsForAdmin(
    cafeId: number,
    page: number = 0,
    size: number = 100,
    sortBy: string = "bookingTime",
    sortDirection: "ASC" | "DESC" = "DESC",
  ): Observable<{
    content: Booking[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString())
      .set("sortBy", sortBy)
      .set("sortDirection", sortDirection);
    return this.http
      .get<{ data?: any }>(`${this.baseUrl}/bookings/cafe/${cafeId}`, { params })
      .pipe(
        map((res: any) => res?.data || { content: [], totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: size }),
      );
  }

  updateOrderStatusForAdmin(orderId: number, status: string): Observable<Order> {
    const params = new HttpParams().set("status", status);
    return this.http
      .put<{ data?: Order }>(`${this.baseUrl}/orders/${orderId}/status`, null, { params })
      .pipe(map((res: any) => res?.data));
  }

  updateBookingStatusForAdmin(bookingId: number, status: string): Observable<Booking> {
    const params = new HttpParams().set("status", status);
    return this.http
      .put<{ data?: Booking }>(`${this.baseUrl}/bookings/${bookingId}/status`, null, { params })
      .pipe(map((res: any) => res?.data));
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
  getAllUsers(
    page: number = 0,
    size: number = 20,
  ): Observable<{
    content: User[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());
    return this.http.get<{
      content: User[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    }>(`${this.baseUrl}/admin/users`, { params });
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/admin/users/${id}`);
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/admin/users/role/${role}`);
  }

  createCafeOwner(request: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/admin/cafe-owners`,
      request,
    );
  }

  createChef(cafeId: number, request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/staff/chef`, {
      ...request,
      cafeId,
    });
  }

  createWaiter(cafeId: number, request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/staff/waiter`, {
      ...request,
      cafeId,
    });
  }

  getStaffByCafe(cafeId: number): Observable<User[]> {
    return this.http
      .get<{ data?: User[] }>(`${this.baseUrl}/staff/cafe/${cafeId}`)
      .pipe(map((res: any) => res?.data || []));
  }

  activateStaff(staffId: number): Observable<User> {
    return this.http
      .patch<{ data?: User }>(`${this.baseUrl}/staff/${staffId}/activate`, null)
      .pipe(map((res: any) => res?.data));
  }

  deactivateStaff(staffId: number): Observable<User> {
    return this.http
      .patch<{ data?: User }>(`${this.baseUrl}/staff/${staffId}/deactivate`, null)
      .pipe(map((res: any) => res?.data));
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/admin/users/${id}`, user);
  }

  deleteUser(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/admin/users/${id}`);
  }

  activateUser(id: number): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(
      `${this.baseUrl}/admin/users/${id}/activate`,
      null,
    );
  }

  deactivateUser(id: number): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(
      `${this.baseUrl}/admin/users/${id}/deactivate`,
      null,
    );
  }

  getPendingUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/admin/pending-users`);
  }

  approveUser(userId: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(
      `${this.baseUrl}/admin/approve/${userId}`,
      null,
    );
  }

  rejectUser(userId: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(
      `${this.baseUrl}/admin/reject/${userId}`,
      null,
    );
  }
}
