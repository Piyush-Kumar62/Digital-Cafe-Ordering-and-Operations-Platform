import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "@environments/environment";
import { Cafe, CreateCafeRequest, Table } from "@shared/models/cafe.model";
import { MenuItem, MenuItemRequest } from "@shared/models/menu.model";
import { Order, OrderRequest } from "@shared/models/order.model";
import { Booking, BookingRequest } from "@shared/models/booking.model";
import { Payment, PaymentRequest } from "@shared/models/payment.model";
import {
  AdminProfile,
  AdminProfileUpdateRequest,
  ProfileImageUploadResponse,
} from "@shared/models/admin-profile.model";
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
import { Institution } from "@shared/models/education.model";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  readonly backendBase = environment.apiUrl.replace(/\/api$/, "");

  constructor(private http: HttpClient) {}

  /**
   * Converts any image path returned by the backend into a browser-loadable URL.
   *  - Already an http(s)/data URL → returned as-is
   *  - Starts with /            → prefixed with backend origin (e.g. http://localhost:8080)
   *  - Absolute filesystem path → discarded (returns '')
   *  - null / empty             → returns ''
   */
  resolveImageUrl(src: string | null | undefined): string {
    if (!src) return "";
    if (/^(https?:\/\/|data:)/.test(src)) return src;
    if (src.startsWith("/assets/")) {
      return src.replace(/^\/+/, "");
    }
    if (src.startsWith("assets/")) {
      return src;
    }
    if (src.startsWith("/")) return `${this.backendBase}${src}`;
    // Absolute filesystem path (Windows drive letter or backslash) — discard
    if (/^[A-Za-z]:[/\\]/.test(src) || src.startsWith("\\\\")) return "";
    return src;
  }

  getAllCafes(): Observable<Cafe[]> {
    return this.http.get<Cafe[]>(`${this.baseUrl}/cafes`);
  }

  getCafeById(id: number): Observable<Cafe> {
    return this.http
      .get<any>(`${this.baseUrl}/cafes/${id}`)
      .pipe(
        map((res: any) =>
          this.resolveCafeImages(
            this.unwrapApiData<Cafe>(res, res as Cafe),
          ),
        ),
      );
  }

  getActiveCafes(): Observable<Cafe[]> {
    return this.http
      .get<{ data?: Cafe[] }>(`${this.baseUrl}/cafes/active`)
      .pipe(map((res: any) => res?.data || []));
  }

  getCafesByCity(city: string): Observable<Cafe[]> {
    return this.http.get<Cafe[]>(`${this.baseUrl}/cafes/city/${city}`);
  }

  searchInstitutions(search: string): Observable<Institution[]> {
    const params = new HttpParams().set("search", search);
    return this.http
      .get<any>(`${this.baseUrl}/institutions`, { params })
      .pipe(map((res) => res?.data || res || []));
  }

  getDegrees(): Observable<{ id?: number; name: string }[]> {
    return this.http
      .get<any>(`${this.baseUrl}/degrees`)
      .pipe(map((res) => res?.data || res || []));
  }

  getBranches(
    degreeId?: number,
    degree?: string,
  ): Observable<{ id?: number; name: string; degreeId?: number; degreeName?: string }[]> {
    let params = new HttpParams();
    if (degreeId) params = params.set("degreeId", String(degreeId));
    if (degree) params = params.set("degree", degree);
    return this.http
      .get<any>(`${this.baseUrl}/branches`, { params })
      .pipe(map((res) => res?.data || res || []));
  }

  getAdminInstitutions(
    search: string,
    page: number,
    size: number,
  ): Observable<{
    content: Institution[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    isFirst?: boolean;
    isLast?: boolean;
  }> {
    let params = new HttpParams().set("page", String(page)).set("size", String(size));
    if (search) params = params.set("search", search);
    return this.http
      .get<any>(`${this.baseUrl}/admin/education/institutions`, { params })
      .pipe(map((res) => res?.data || res || {}));
  }

  importInstitutionsAdmin(file: File): Observable<{
    totalRows?: number;
    inserted?: number;
    skipped?: number;
    errors?: string[];
  }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http
      .post<any>(`${this.baseUrl}/admin/education/institutions/import`, formData)
      .pipe(map((res) => res?.data || res || {}));
  }

  importInstitutionsAdminProgress(
    file: File,
  ): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<any>(
      `${this.baseUrl}/admin/education/institutions/import`,
      formData,
      { observe: "events", reportProgress: true },
    );
  }

  getImportJobStatus(
    id: number,
  ): Observable<{
    id: number;
    importType: string;
    status: string;
    fileName?: string;
    totalRows?: number;
    insertedRows?: number;
    skippedRows?: number;
    errorMessage?: string;
    errors?: string[];
    startedAt?: string;
    finishedAt?: string;
  }> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/education/imports/${id}`)
      .pipe(map((res) => res?.data || res || {}));
  }

  getLatestEducationImport(
    type: "INSTITUTIONS" | "DEGREES" | "BRANCHES" = "INSTITUTIONS",
  ): Observable<{
    id: number;
    importType: string;
    status: string;
    fileName?: string;
    totalRows?: number;
    insertedRows?: number;
    skippedRows?: number;
    errorMessage?: string;
    errors?: string[];
    startedAt?: string;
    finishedAt?: string;
  }> {
    const params = new HttpParams().set("type", type);
    return this.http
      .get<any>(`${this.baseUrl}/admin/education/imports/latest`, { params })
      .pipe(map((res) => res?.data || res || {}));
  }

  getEducationHealth(): Observable<{
    institutionCount: number;
    degreeCount: number;
    branchCount: number;
    degreesMissingBranches: number;
    degreeNamesMissingBranches: string[];
  }> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/education/health`)
      .pipe(
        map((res) => res?.data || res || {
          institutionCount: 0,
          degreeCount: 0,
          branchCount: 0,
          degreesMissingBranches: 0,
          degreeNamesMissingBranches: [],
        }),
      );
  }

  importLocalEducationFile(
    filename: string,
    type: "INSTITUTIONS" | "DEGREES" | "BRANCHES" = "INSTITUTIONS",
  ): Observable<{
    id?: number;
    importType?: string;
    status?: string;
    fileName?: string;
  }> {
    const params = new HttpParams().set("filename", filename).set("type", type);
    return this.http
      .post<any>(`${this.baseUrl}/admin/education/imports/local`, null, { params })
      .pipe(map((res) => res?.data || res || {}));
  }

  getEducationDuplicateReport(): Observable<{
    institutionDuplicateGroups: number;
    degreeDuplicateGroups: number;
    branchDuplicateGroups: number;
    institutionSamples: Array<{ label: string; count: number }>;
    degreeSamples: Array<{ label: string; count: number }>;
    branchSamples: Array<{ label: string; count: number }>;
  }> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/education/duplicates`)
      .pipe(
        map((res) => res?.data || res || {
          institutionDuplicateGroups: 0,
          degreeDuplicateGroups: 0,
          branchDuplicateGroups: 0,
          institutionSamples: [],
          degreeSamples: [],
          branchSamples: [],
        }),
      );
  }

  createCafe(request: CreateCafeRequest): Observable<Cafe> {
    return this.http.post<Cafe>(`${this.baseUrl}/cafes`, request);
  }

  updateCafe(id: number, request: any): Observable<Cafe> {
    const payload = {
      name: String(request?.name || "").trim(),
      description: String(request?.description || "").trim(),
      address: String(request?.address || "").trim(),
      city: String(request?.city || "").trim(),
      state: String(request?.state || "").trim(),
      pincode: String(request?.pincode || request?.zipCode || "").trim(),
      phoneNumber: String(request?.phoneNumber || "").trim(),
      email: String(request?.email || "").trim(),
      openTime: String(request?.openTime || request?.openingTime || "").trim(),
      closeTime: String(request?.closeTime || request?.closingTime || "").trim(),
      fssaiNumber: String(request?.fssaiNumber || "").trim(),
      gstNumber: String(request?.gstNumber || "").trim(),
      msmeNumber: String(request?.msmeNumber || "").trim(),
    };

    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );

    return this.http
      .put<any>(`${this.baseUrl}/cafes/${id}`, formData)
      .pipe(
        map((res: any) =>
          this.resolveCafeImages(
            this.unwrapApiData<Cafe>(res, res as Cafe),
          ),
        ),
      );
  }

  deleteCafe(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/cafes/${id}`);
  }

  private resolveCafeImages(cafe: any): Cafe {
    if (!cafe) return cafe;
    const galleryImages = Array.isArray(cafe.galleryImages)
      ? cafe.galleryImages.map((img: string) => this.resolveImageUrl(img)).filter(Boolean)
      : [];
    return {
      ...cafe,
      logoUrl: this.resolveImageUrl(cafe.logoUrl),
      coverUrl: this.resolveImageUrl(cafe.coverUrl),
      imageUrl: this.resolveImageUrl(cafe.imageUrl || cafe.logoUrl),
      galleryImages,
    };
  }

  getMyCafe(): Observable<Cafe> {
    return this.http
      .get<any>(`${this.baseUrl}/cafes/my-cafe`)
      .pipe(map((res) => this.resolveCafeImages(res?.data || res)));
  }

  getMyCafes(page = 0, size = 20): Observable<Cafe[]> {
    return this.http
      .get<any>(`${this.baseUrl}/cafes/my-cafes`, { params: { page, size } })
      .pipe(
        map((res) => {
          const cafes: any[] = res?.data?.content || res?.content || [];
          return cafes.map((c) => this.resolveCafeImages(c));
        }),
      );
  }

  cafeExistsForOwner(): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/cafes/exists`);
  }

  updateCafeSetup(id: number, data: FormData): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/cafes/${id}`, data);
  }

  createCafeSetup(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cafes/setup`, data);
  }

  uploadLogo(cafeId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/cafes/${cafeId}/logo`,
      formData,
    );
  }

  uploadCover(cafeId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/cafes/${cafeId}/cover`,
      formData,
    );
  }

  uploadGallery(cafeId: number, formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/cafes/${cafeId}/gallery`,
      formData,
    );
  }

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
      .get<any>(
        `${this.baseUrl}/menu-items/cafe/${cafeId}/category/${category}`,
      )
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

  uploadMenuItemImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http
      .post<any>(`${this.baseUrl}/menu-items/upload-image`, formData)
      .pipe(map((res: any) => res?.data?.imageUrl || ""));
  }

  toggleMenuItemAvailability(
    id: number,
    isAvailable: boolean,
  ): Observable<MenuItem> {
    const params = new HttpParams().set("isAvailable", String(isAvailable));
    return this.http
      .patch<any>(`${this.baseUrl}/menu-items/${id}/availability`, null, {
        params,
      })
      .pipe(map((res: any) => res?.data || res));
  }

  deleteMenuItem(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.baseUrl}/menu-items/${id}`,
    );
  }

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

  getReadyOrdersForWaiterWorkflow(): Observable<Order[]> {
    return this.http
      .get<any>(`${this.baseUrl}/waiter/ready-orders`)
      .pipe(map((res: any) => this.unwrapApiData<Order[]>(res, [])));
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

  getChefOrders(): Observable<Order[]> {
    return this.http
      .get<any>(`${this.baseUrl}/chef/orders`)
      .pipe(map((res: any) => this.unwrapApiData<Order[]>(res, [])));
  }

  markOrderPreparing(orderId: number): Observable<Order> {
    return this.http
      .put<any>(`${this.baseUrl}/chef/order/${orderId}/preparing`, null)
      .pipe(map((res: any) => this.unwrapApiData<Order>(res, res as Order)));
  }

  markOrderReady(orderId: number): Observable<Order> {
    return this.http
      .put<any>(`${this.baseUrl}/chef/order/${orderId}/ready`, null)
      .pipe(map((res: any) => this.unwrapApiData<Order>(res, res as Order)));
  }

  markOrderServed(orderId: number): Observable<Order> {
    return this.http
      .put<any>(`${this.baseUrl}/waiter/order/${orderId}/served`, null)
      .pipe(map((res: any) => this.unwrapApiData<Order>(res, res as Order)));
  }

  cancelOrder(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/orders/${id}`);
  }

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

  createPayment(request: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.baseUrl}/payments`, request);
  }

  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/payments/${id}`);
  }

  getPaymentByOrder(orderId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/payments/order/${orderId}`);
  }

  getMyPayments(): Observable<Payment[]> {
    return this.http
      .get<any>(`${this.baseUrl}/payments/my`)
      .pipe(map((res: any) => this.unwrapApiData<Payment[]>(res, [])));
  }

  verifyPayment(
    paymentId: number,
    paymentGatewayPaymentId: string,
    signature: string,
  ): Observable<Payment> {
    return this.http
      .post<any>(`${this.baseUrl}/payments/${paymentId}/verify`, {
        paymentGatewayPaymentId,
        signature,
      })
      .pipe(
        map((res: any) => this.unwrapApiData<Payment>(res, res as Payment)),
      );
  }

  markPaymentFailed(paymentId: number, reason: string): Observable<Payment> {
    return this.http
      .post<any>(`${this.baseUrl}/payments/${paymentId}/fail`, { reason })
      .pipe(
        map((res: any) => this.unwrapApiData<Payment>(res, res as Payment)),
      );
  }

  downloadPaymentReceipt(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/payments/${paymentId}/receipt`, {
      responseType: "blob",
    });
  }

  resendPaymentReceiptEmail(paymentId: number): Observable<Payment> {
    return this.http
      .post<any>(`${this.baseUrl}/payments/${paymentId}/receipt/email`, {})
      .pipe(
        map((res: any) => this.unwrapApiData<Payment>(res, res as Payment)),
      );
  }

  getAdminProfile(): Observable<AdminProfile> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/profile`)
      .pipe(
        map((res: any) =>
          this.unwrapApiData<AdminProfile>(res, res as AdminProfile),
        ),
      );
  }

  updateAdminProfile(
    request: AdminProfileUpdateRequest,
  ): Observable<AdminProfile> {
    return this.http
      .put<any>(`${this.baseUrl}/admin/profile`, request)
      .pipe(
        map((res: any) =>
          this.unwrapApiData<AdminProfile>(res, res as AdminProfile),
        ),
      );
  }

  uploadAdminProfileImage(file: File): Observable<ProfileImageUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http
      .post<any>(`${this.baseUrl}/admin/profile/image`, formData)
      .pipe(
        map((res: any) =>
          this.unwrapApiData<ProfileImageUploadResponse>(
            res,
            res as ProfileImageUploadResponse,
          ),
        ),
      );
  }

  deleteAdminProfileImage(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/profile/image`);
  }

  uploadCustomerProfileImage(
    file: File,
  ): Observable<ProfileImageUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http
      .post<any>(`${this.baseUrl}/users/profile/self/image`, formData)
      .pipe(
        map((res: any) =>
          this.unwrapApiData<ProfileImageUploadResponse>(
            res,
            res as ProfileImageUploadResponse,
          ),
        ),
      );
  }

  updateCustomerProfile(request: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    govtIdType?: string;
    govtIdNumber?: string;
    joiningDate?: string;
    experienceYears?: number;
    shift?: string;
    address?: {
      street?: string;
      plotNumber?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
    };
  }): Observable<{
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    govtIdType?: string;
    govtIdNumber?: string;
    joiningDate?: string;
    experienceYears?: number;
    shift?: string;
    address?: {
      street?: string;
      plotNumber?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
    };
    profileImageUrl?: string;
    profileCompletionPercentage?: number;
    lastLogin?: string;
  }> {
    return this.http
      .put<any>(`${this.baseUrl}/users/profile/self`, request)
      .pipe(
        map((res: any) =>
          this.unwrapApiData(res, {
            firstName: "",
            lastName: "",
            displayName: "",
            phoneNumber: "",
            dateOfBirth: "",
            gender: "",
            govtIdType: "",
            govtIdNumber: "",
            joiningDate: "",
            experienceYears: 0,
            shift: "",
            address: {
              street: "",
              plotNumber: "",
              city: "",
              state: "",
              country: "",
              pincode: "",
            },
          }),
        ),
      );
  }

  getCustomerProfile(): Observable<{
    firstName?: string;
    lastName?: string;
    email?: string;
    displayName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    govtIdType?: string;
    govtIdNumber?: string;
    joiningDate?: string;
    experienceYears?: number;
    shift?: string;
    address?: {
      street?: string;
      plotNumber?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
    };
    profileImageUrl?: string;
    profileCompletionPercentage?: number;
    lastLogin?: string;
  }> {
    return this.http.get<any>(`${this.baseUrl}/users/profile/self`).pipe(
      map((res: any) =>
        this.unwrapApiData(res, {
          firstName: "",
          lastName: "",
          displayName: "",
          phoneNumber: "",
          dateOfBirth: "",
          gender: "",
          govtIdType: "",
          govtIdNumber: "",
          joiningDate: "",
          experienceYears: 0,
          shift: "",
          address: {
            street: "",
            plotNumber: "",
            city: "",
            state: "",
            country: "",
            pincode: "",
          },
        }),
      ),
    );
  }

  getMyFullProfile(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/profiles/me`)
      .pipe(map((res: any) => this.unwrapApiData<any>(res, null)));
  }

  saveMyFullProfile(request: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/profiles`, request)
      .pipe(map((res: any) => this.unwrapApiData<any>(res, null)));
  }

  deleteCustomerProfileImage(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/profile/self/image`);
  }

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

  getAdminDashboard(): Observable<AdminDashboard> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/dashboard/stats`)
      .pipe(map((res: any) => res?.data ?? res));
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
        map(
          (res: any) =>
            res?.data || {
              content: [],
              totalElements: 0,
              totalPages: 0,
              pageNumber: 0,
              pageSize: size,
            },
        ),
      );
  }

  toggleCafeStatus(cafeId: number, isActive: boolean): Observable<Cafe> {
    const params = new HttpParams().set("isActive", String(isActive));
    return this.http
      .patch<{
        data?: Cafe;
      }>(`${this.baseUrl}/cafes/${cafeId}/status`, null, { params })
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
        map(
          (res: any) =>
            res?.data || {
              content: [],
              totalElements: 0,
              totalPages: 0,
              pageNumber: 0,
              pageSize: size,
            },
        ),
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
      .get<{
        data?: any;
      }>(`${this.baseUrl}/bookings/cafe/${cafeId}`, { params })
      .pipe(
        map(
          (res: any) =>
            res?.data || {
              content: [],
              totalElements: 0,
              totalPages: 0,
              pageNumber: 0,
              pageSize: size,
            },
        ),
      );
  }

  updateOrderStatusForAdmin(
    orderId: number,
    status: string,
  ): Observable<Order> {
    const params = new HttpParams().set("status", status);
    return this.http
      .put<{
        data?: Order;
      }>(`${this.baseUrl}/orders/${orderId}/status`, null, { params })
      .pipe(map((res: any) => res?.data));
  }

  updateBookingStatusForAdmin(
    bookingId: number,
    status: string,
  ): Observable<Booking> {
    const params = new HttpParams().set("status", status);
    return this.http
      .put<{
        data?: Booking;
      }>(`${this.baseUrl}/bookings/${bookingId}/status`, null, { params })
      .pipe(map((res: any) => res?.data));
  }

  getOwnerDashboard(cafeId: number): Observable<OwnerDashboard> {
    return this.http
      .get<{ data?: OwnerDashboard }>(`${this.baseUrl}/owner/dashboard`)
      .pipe(map((res: any) => res?.data ?? res));
  }

  getChefDashboard(cafeId: number): Observable<ChefDashboard> {
    return this.http
      .get<{ data?: ChefDashboard }>(`${this.baseUrl}/chef/dashboard`)
      .pipe(map((res: any) => res?.data ?? res));
  }

  getWaiterDashboard(cafeId: number): Observable<WaiterDashboard> {
    return this.http
      .get<{ data?: WaiterDashboard }>(`${this.baseUrl}/waiter/dashboard`)
      .pipe(map((res: any) => res?.data ?? res));
  }

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
    return this.http
      .get<any>(`${this.baseUrl}/admin/users`, { params })
      .pipe(map((res: any) => res?.data || res));
  }

  getUserById(id: number): Observable<User> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/users/${id}`)
      .pipe(map((res: any) => res?.data || res));
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.http
      .get<any>(`${this.baseUrl}/admin/users/role/${role}`)
      .pipe(map((res: any) => res?.data || res));
  }

  createChef(cafeId: number, request: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/staff`, {
        ...request,
        cafeId,
        role: "CHEF",
      })
      .pipe(map((res) => res?.data || res));
  }

  createWaiter(cafeId: number, request: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/staff`, {
        ...request,
        cafeId,
        role: "WAITER",
      })
      .pipe(map((res) => res?.data || res));
  }

  createStaff(data: any): Observable<User> {
    return this.http
      .post<any>(`${this.baseUrl}/staff`, data)
      .pipe(map((res) => res?.data || res));
  }

  updateStaff(id: number, data: any): Observable<User> {
    return this.http
      .put<any>(`${this.baseUrl}/staff/${id}`, data)
      .pipe(map((res) => res?.data || res));
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
      .patch<{
        data?: User;
      }>(`${this.baseUrl}/staff/${staffId}/deactivate`, null)
      .pipe(map((res: any) => res?.data));
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/admin/users/${id}`, user);
  }

  deleteUser(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.baseUrl}/admin/users/${id}`,
    );
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
    return this.http
      .get<any>(`${this.baseUrl}/admin/pending-users`)
      .pipe(map((res: any) => res?.data || res));
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

  getAdminActivities(
    page: number = 0,
    size: number = 10,
  ): Observable<{
    content: Array<{
      timestamp: string;
      description: string;
      userRole?: string;
      activityType?: string;
      type?: string;
    }>;
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    return this.http
      .get<any>(`${this.baseUrl}/admin/activities`, { params })
      .pipe(
        map((res: any) =>
          this.unwrapApiData(res, {
            content: [],
            totalElements: 0,
            totalPages: 0,
            pageNumber: page,
            pageSize: size,
          }),
        ),
      );
  }

  getAdminPaymentWebhookEvents(
    page: number = 0,
    size: number = 10,
  ): Observable<{
    content: Array<{
      id: number;
      provider: string;
      eventId: string;
      eventType: string;
      status: string;
      attemptCount: number;
      paymentId?: number;
      paymentGatewayOrderId?: string;
      paymentGatewayPaymentId?: string;
      signatureHash?: string;
      lastError?: string;
      processedAt?: string;
      createdAt?: string;
      updatedAt?: string;
    }>;
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    return this.http
      .get<any>(`${this.baseUrl}/admin/payment-webhooks`, { params })
      .pipe(
        map((res: any) =>
          this.unwrapApiData(res, {
            content: [],
            totalElements: 0,
            totalPages: 0,
            pageNumber: page,
            pageSize: size,
          }),
        ),
      );
  }

  private unwrapApiData<T>(response: any, fallback: T): T {
    if (response && typeof response === "object" && "data" in response) {
      return (response.data ?? fallback) as T;
    }
    return (response ?? fallback) as T;
  }
}
