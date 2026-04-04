import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { ThemeService } from "@core/services/theme.service";
import { AlertService } from "@core/services/alert.service";
import { getOwnerRegistrationCompletion } from "@core/utils/owner-profile-completion.util";
import { CafeContextService } from "../services/cafe-context.service";
import { Cafe } from "@shared/models/cafe.model";
import { User } from "@shared/models/auth.model";
import { WebSocketService } from "@core/websocket/websocket.service";
import { NgZone } from "@angular/core";

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

interface OwnerHeaderNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

@Component({
  selector: "app-owner-layout",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./owner-layout.component.html",
  styleUrls: ["./owner-layout.component.scss"],
})
export class OwnerLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  private isMobileView = false;
  currentUser: User | null = null;
  isDarkMode = false;
  profileDropdownOpen = false;
  showNotifications = false;
  profileImage = "";
  private profileImageVersion = Date.now();
  profileCompletion = 0;
  lastLogin: Date | null = null;
  notifications: OwnerHeaderNotification[] = [];
  unreadNotifications = 0;
  readonly notificationPageSize = 10;
  notificationCurrentPage = 1;
  isDashboardRoute = false;
  private routerEventsSub?: Subscription;
  private userSub?: Subscription;
  private ownerOrderSub?: Subscription;
  private ownerTableSub?: Subscription;
  private ownerUserNotifSub?: Subscription;
  private ownerGlobalNotifSub?: Subscription;
  private ownerOrderDest: string | null = null;
  private ownerTableDest: string | null = null;
  private ownerUserNotifDest: string | null = null;
  private ownerGlobalNotifDest: string | null = null;

  // Multi-cafe support
  allCafes: Cafe[] = [];
  activeCafe: Cafe | null = null;
  cafePickerOpen = false;
  private cafeContextSub?: Subscription;

  @ViewChild("profileContainer", { static: false })
  profileContainer!: ElementRef;

  /* ✅ OWNER NAVIGATION */
  navigationItems: NavigationItem[] = [
    { label: "Dashboard", icon: "speedometer2", route: "/owner/dashboard" },
    { label: "My Café", icon: "shop", route: "/owner/cafes" },
    { label: "Tables", icon: "grid-3x3-gap", route: "/owner/tables" },
    { label: "Menu", icon: "journal-text", route: "/owner/menu" },
    { label: "Staff", icon: "people", route: "/owner/staff" },
    { label: "Orders", icon: "cart3", route: "/owner/orders" },
    { label: "Bookings", icon: "calendar-check", route: "/owner/bookings" },
    { label: "Settings", icon: "gear", route: "/owner/settings" },
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private themeService: ThemeService,
    private router: Router,
    private cafeCtx: CafeContextService,
    private alertService: AlertService,
    private webSocketService: WebSocketService,
    private ngZone: NgZone,
  ) {
    this.themeService.syncFromStorage();
    this.isDarkMode = this.themeService.isDarkMode();

    if (typeof window !== "undefined") {
      this.isMobileView = window.innerWidth < 1024;
      this.isSidebarCollapsed = this.isMobileView;
    }
  }

  ngOnInit(): void {
    this.userSub = this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.profileCompletion = getOwnerRegistrationCompletion(user);
      this.lastLogin = user?.lastLogin ? new Date(user.lastLogin) : null;
      this.rebindOwnerNotifications();

      const resolved = this.apiService.resolveImageUrl(
        user?.profileImageUrl || "",
      );
      this.profileImage = resolved
        ? `${resolved}${resolved.includes("?") ? "&" : "?"}v=${this.profileImageVersion}`
        : "";
      this.profileImageVersion = Date.now();
    });

    this.refreshProfileFromDb();
    this.seedNotifications();
    this.updateRouteState(this.router.url);

    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.updateRouteState(nav.urlAfterRedirects || nav.url);
        this.cafePickerOpen = false;
        this.showNotifications = false;
        this.profileDropdownOpen = false;
      });

    // Skip owner cafe context calls until profile completion is available.
    if (getOwnerRegistrationCompletion(this.currentUser) >= 100) {
      this.cafeCtx.loadCafes().subscribe();
    }
    this.cafeContextSub = this.cafeCtx.allCafes$.subscribe((cafes) => {
      this.allCafes = cafes;
    });
    this.cafeCtx.activeCafe$.subscribe((cafe) => {
      this.activeCafe = cafe;
    });
  }

  goHome(): void {
    this.router.navigate(["/"]);
  }

  toggleCafePicker(): void {
    this.cafePickerOpen = !this.cafePickerOpen;
  }

  selectCafe(cafe: Cafe): void {
    this.cafeCtx.setActiveCafe(cafe);
    this.cafePickerOpen = false;
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.cafeContextSub?.unsubscribe();
    this.unbindOwnerNotifications();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  async logout(): Promise<void> {
    const ok = await this.alertService.confirm(
      "Confirm logout",
      "Are you sure you want to log out?",
    );
    if (!ok) return;
    this.cafeCtx.clear();
    this.authService.logout();
    this.alertService.success(
      "Logged out",
      "You have been signed out successfully.",
    );
    this.router.navigate(["/auth/login"]);
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setTheme(this.isDarkMode);
  }

  getAvatarText(): string {
    const name =
      `${this.currentUser?.firstName || ""} ${this.currentUser?.lastName || ""}`.trim() ||
      this.currentUser?.username ||
      "";
    return name.charAt(0).toUpperCase() || "O";
  }

  getDisplayName(): string {
    return (
      this.currentUser?.firstName || this.currentUser?.username || "Café Owner"
    );
  }

  getUserEmail(): string {
    return this.currentUser?.email || "";
  }

  getRoleLabel(): string {
    return "Café Owner";
  }

  toggleProfileDropdown(): void {
    this.showNotifications = false;
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  toggleNotifications(): void {
    this.profileDropdownOpen = false;
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.notificationCurrentPage = 1;
    }
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.syncUnreadCount();
  }

  closeHeaderPopovers(): void {
    this.showNotifications = false;
    this.profileDropdownOpen = false;
  }

  getWelcomeName(): string {
    return this.getDisplayName();
  }

  getLastLoginText(): string {
    if (!this.lastLogin) return "Just now";
    return this.lastLogin.toLocaleString();
  }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes("/dashboard")) return "Dashboard";
    if (url.includes("/cafes")) return "My Café";
    if (url.includes("/tables")) return "Tables";
    if (url.includes("/menu")) return "Menu";
    if (url.includes("/staff")) return "Staff";
    if (url.includes("/orders")) return "Orders";
    if (url.includes("/bookings")) return "Bookings";
    if (url.includes("/settings")) return "Settings";
    return "Café Owner";
  }

  getPageSubtitle(): string {
    const url = this.router.url;
    if (url.includes("/dashboard")) return "Overview of your café operations";
    if (url.includes("/cafes")) return "Manage your café details";
    if (url.includes("/tables")) return "Table layout and reservations";
    if (url.includes("/menu")) return "Manage your menu items";
    if (url.includes("/staff")) return "Staff management";
    if (url.includes("/orders")) return "Track and manage orders";
    if (url.includes("/bookings")) return "Booking requests and schedules";
    if (url.includes("/settings")) return "Account and café settings";
    return "";
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (
      this.showNotifications &&
      !this.profileContainer?.nativeElement.contains(target)
    ) {
      this.showNotifications = false;
    }

    if (
      this.profileDropdownOpen &&
      this.profileContainer &&
      !this.profileContainer.nativeElement.contains(target)
    ) {
      this.profileDropdownOpen = false;
    }
  }

  @HostListener("window:storage", ["$event"])
  onStorageThemeChange(event: StorageEvent): void {
    if (event.key !== "theme" && event.key !== "cafe_theme") {
      return;
    }
    this.themeService.syncFromStorage();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  @HostListener("window:theme-changed", ["$event"])
  onThemeChanged(event: Event): void {
    const customEvent = event as CustomEvent<{ dark: boolean }>;
    if (typeof customEvent?.detail?.dark === "boolean") {
      this.isDarkMode = customEvent.detail.dark;
      return;
    }
    this.themeService.syncFromStorage();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  private updateRouteState(url: string): void {
    this.isDashboardRoute = /^\/owner\/dashboard/.test(url);
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    const mobile = window.innerWidth < 1024;
    if (mobile !== this.isMobileView) {
      this.isMobileView = mobile;
      this.isSidebarCollapsed = mobile;
    }
  }

  private seedNotifications(): void {
    this.notifications = [
      {
        id: "owner-notif-1",
        title: "Welcome to Owner Dashboard",
        message: "You can monitor orders, staff and reservations from here.",
        createdAt: new Date().toLocaleString(),
        read: false,
      },
    ];
    this.syncUnreadCount();
  }

  private bindOwnerNotifications(): void {
    const userId = this.currentUser?.id;
    const cafeId = this.currentUser?.cafeId;

    if (userId) {
      this.ownerUserNotifDest = `/user/${userId}/queue/notifications`;
      this.ownerUserNotifSub = this.webSocketService
        .watchDestination<any>(this.ownerUserNotifDest)
        .subscribe({
          next: (payload) =>
            this.ngZone.run(() => this.pushNotification(payload)),
        });

      this.ownerGlobalNotifDest = "/user/queue/notifications";
      this.ownerGlobalNotifSub = this.webSocketService
        .watchDestination<any>(this.ownerGlobalNotifDest)
        .subscribe({
          next: (payload) =>
            this.ngZone.run(() => this.pushNotification(payload)),
        });
    }

    if (cafeId) {
      this.ownerOrderDest = `/topic/cafe/${cafeId}`;
      this.ownerOrderSub = this.webSocketService
        .watchDestination<any>(this.ownerOrderDest)
        .subscribe({
          next: (payload) =>
            this.ngZone.run(() => this.pushNotification(payload)),
        });

      this.ownerTableDest = `/topic/cafe/${cafeId}/tables`;
      this.ownerTableSub = this.webSocketService
        .watchDestination<any>(this.ownerTableDest)
        .subscribe({
          next: (payload) =>
            this.ngZone.run(() => this.pushNotification(payload)),
        });
    }
  }

  private rebindOwnerNotifications(): void {
    this.unbindOwnerNotifications();
    this.bindOwnerNotifications();
  }

  private unbindOwnerNotifications(): void {
    this.ownerOrderSub?.unsubscribe();
    this.ownerTableSub?.unsubscribe();
    this.ownerUserNotifSub?.unsubscribe();
    this.ownerGlobalNotifSub?.unsubscribe();
    this.ownerOrderSub = undefined;
    this.ownerTableSub = undefined;
    this.ownerUserNotifSub = undefined;
    this.ownerGlobalNotifSub = undefined;

    if (this.ownerOrderDest) {
      this.webSocketService.unsubscribe(this.ownerOrderDest);
      this.ownerOrderDest = null;
    }
    if (this.ownerTableDest) {
      this.webSocketService.unsubscribe(this.ownerTableDest);
      this.ownerTableDest = null;
    }
    if (this.ownerUserNotifDest) {
      this.webSocketService.unsubscribe(this.ownerUserNotifDest);
      this.ownerUserNotifDest = null;
    }
    if (this.ownerGlobalNotifDest) {
      this.webSocketService.unsubscribe(this.ownerGlobalNotifDest);
      this.ownerGlobalNotifDest = null;
    }
  }

  private pushNotification(payload: any): void {
    const title = payload?.title || payload?.type || "Cafe Update";
    const message =
      payload?.message ||
      payload?.description ||
      "You have a new notification.";
    const createdAt = payload?.timestamp
      ? new Date(payload.timestamp).toLocaleString()
      : new Date().toLocaleString();

    const fingerprint = `${title}|${message}|${createdAt}`;
    const duplicate = this.notifications.some(
      (n) => `${n.title}|${n.message}|${n.createdAt}` === fingerprint,
    );
    if (duplicate) {
      return;
    }

    this.notifications = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        message,
        createdAt,
        read: false,
      },
      ...this.notifications,
    ].slice(0, 60);
    this.notificationCurrentPage = 1;
    this.syncUnreadCount();
  }

  get totalNotificationPages(): number {
    return Math.max(
      1,
      Math.ceil(this.notifications.length / this.notificationPageSize),
    );
  }

  get pagedNotifications(): OwnerHeaderNotification[] {
    const start =
      (this.notificationCurrentPage - 1) * this.notificationPageSize;
    return this.notifications.slice(start, start + this.notificationPageSize);
  }

  prevNotificationPage(): void {
    if (this.notificationCurrentPage > 1) {
      this.notificationCurrentPage -= 1;
    }
  }

  nextNotificationPage(): void {
    if (this.notificationCurrentPage < this.totalNotificationPages) {
      this.notificationCurrentPage += 1;
    }
  }

  private syncUnreadCount(): void {
    this.unreadNotifications = this.notifications.filter((n) => !n.read).length;
  }

  private refreshProfileFromDb(): void {
    this.apiService.getCustomerProfile().subscribe({
      next: (profile) => {
        if (!this.currentUser) return;
        const firstName = profile?.firstName || this.currentUser.firstName;
        const lastName = profile?.lastName || this.currentUser.lastName;
        const updated: User = {
          ...this.currentUser,
          firstName,
          lastName,
          displayName:
            profile?.displayName ||
            this.currentUser.displayName ||
            `${firstName} ${lastName}`.trim(),
          phoneNumber: profile?.phoneNumber || this.currentUser.phoneNumber,
          govtIdType: profile?.govtIdType || this.currentUser.govtIdType,
          govtIdNumber: profile?.govtIdNumber || this.currentUser.govtIdNumber,
          profileImageUrl:
            profile?.profileImageUrl || this.currentUser.profileImageUrl,
          profileCompletionPercentage: getOwnerRegistrationCompletion({
            firstName,
            lastName,
            email: this.currentUser.email,
            phoneNumber: profile?.phoneNumber || this.currentUser.phoneNumber,
          }),
          isProfileComplete:
            getOwnerRegistrationCompletion({
              firstName,
              lastName,
              email: this.currentUser.email,
              phoneNumber: profile?.phoneNumber || this.currentUser.phoneNumber,
            }) >= 100,
          lastLogin: profile?.lastLogin || this.currentUser.lastLogin,
        };
        this.currentUser = updated;
        this.authService.updateUserData(updated);

        const resolved = this.apiService.resolveImageUrl(
          updated.profileImageUrl || "",
        );
        this.profileImage = resolved
          ? `${resolved}${resolved.includes("?") ? "&" : "?"}v=${this.profileImageVersion}`
          : "";
        this.profileImageVersion = Date.now();
        this.profileCompletion = getOwnerRegistrationCompletion(updated);
        this.lastLogin = updated.lastLogin
          ? new Date(updated.lastLogin)
          : this.lastLogin;
      },
    });
  }
}
