import {
  Component,
  NgZone,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { Subscription, forkJoin, of } from "rxjs";
import { catchError, filter } from "rxjs/operators";

import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { ThemeService } from "@core/services/theme.service";
import { uppercaseMeridiem } from "@core/utils/date-time-format.util";
import { AlertService } from "@core/services/alert.service";
import { WebSocketService } from "@core/websocket/websocket.service";

interface ChefNavItem {
  label: string;
  icon: string;
  route: string;
}

interface ChefNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
  read: boolean;
}

@Component({
  selector: "app-chef-layout",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./chef-layout.component.html",
  styleUrls: ["./chef-layout.component.scss"],
})
export class ChefLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  isMobileView = false;
  currentUser: any;
  isDarkMode = false;
  profileDropdownOpen = false;
  notificationDropdownOpen = false;
  profileImage = "";
  notifications: ChefNotification[] = [];
  readonly notificationPageSize = 10;
  notificationCurrentPage = 1;

  private routerEventsSub?: Subscription;
  private currentUserSub?: Subscription;
  private orderNotifSub?: Subscription;
  private userNotifSub?: Subscription;
  private globalNotifSub?: Subscription;
  private wsOrderDest: string | null = null;
  private wsUserNotifDest: string | null = null;
  private wsGlobalNotifDest: string | null = null;
  private currentWsBindingKey: string | null = null;

  @ViewChild("profileContainer", { static: false })
  profileContainer!: ElementRef;
  @ViewChild("notificationContainer", { static: false })
  notificationContainer!: ElementRef;

  navigationItems: ChefNavItem[] = [
    { label: "Dashboard", icon: "bi-speedometer2", route: "/chef/dashboard" },
    { label: "Active Orders", icon: "bi-fire", route: "/chef/orders" },
    {
      label: "Order History",
      icon: "bi-clock-history",
      route: "/chef/order-history",
    },
    { label: "My Profile", icon: "bi-person-circle", route: "/chef/profile" },
  ];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private themeService: ThemeService,
    private webSocketService: WebSocketService,
    private ngZone: NgZone,
    private alertService: AlertService,
  ) {
    this.themeService.syncFromStorage();
    this.isDarkMode = this.themeService.isDarkMode();
    if (typeof window !== "undefined") {
      this.isMobileView = window.innerWidth < 1024;
      this.isSidebarCollapsed = this.isMobileView;
    }
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.profileImage = this.resolveProfileImage(this.currentUser);
    this.bindOrderNotifications();
    this.currentUserSub = this.authService.currentUser.subscribe((user) => {
      const previousBindingKey = this.currentWsBindingKey;
      this.currentUser = user;
      this.profileImage = this.resolveProfileImage(user);
      const nextBindingKey = this.getWsBindingKey();
      if (previousBindingKey !== nextBindingKey) {
        this.rebindOrderNotifications();
      }
    });
    this.refreshProfileFromDb();
    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
    this.currentUserSub?.unsubscribe();
    this.unbindOrderNotifications();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleProfileDropdown(): void {
    this.notificationDropdownOpen = false;
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  toggleNotificationDropdown(): void {
    this.profileDropdownOpen = false;
    this.notificationDropdownOpen = !this.notificationDropdownOpen;
    if (this.notificationDropdownOpen) {
      this.notificationCurrentPage = 1;
      this.notifications = this.notifications.map((n) => ({
        ...n,
        read: true,
      }));
    }
  }

  goToLanding(): void {
    this.router.navigate(["/"]);
  }

  async logout(): Promise<void> {
    const ok = await this.alertService.confirm(
      "Confirm logout",
      "Are you sure you want to log out?",
    );
    if (!ok) return;
    this.authService.logout();
    this.alertService.success(
      "Logged out",
      "You have been signed out successfully.",
    );
    this.router.navigate(["/auth/login"]).catch(() => {});
  }

  getDisplayName(): string {
    const user = this.currentUser;
    const first = user?.firstName || "";
    const last = user?.lastName || "";
    const full = `${first} ${last}`.trim();
    return user?.displayName || full || user?.username || "Chef";
  }

  getUserEmail(): string {
    return this.currentUser?.email || "";
  }

  getRoleLabel(): string {
    const role = this.currentUser?.roles?.[0] || "ROLE_CHEF";
    return String(role).replace("ROLE_", "");
  }

  getProfileCompletionPercentage(): number {
    const stored = Number(this.currentUser?.profileCompletionPercentage ?? 0);
    const safeStored =
      Number.isNaN(stored) || stored < 0
        ? 0
        : Math.min(100, Math.round(stored));

    // Fallback to live field-based progress if backend percentage is stale.
    const user = this.currentUser || {};
    let filled = 0;
    const total = 8;

    if (String(user.firstName || "").trim()) filled++;
    if (String(user.lastName || "").trim()) filled++;
    if (String(user.displayName || "").trim()) filled++;
    if (String(user.phoneNumber || "").trim()) filled++;
    if (String(user.govtIdType || "").trim()) filled++;
    if (String(user.govtIdNumber || "").trim()) filled++;
    if (String(user.govtIdDocumentPath || "").trim()) filled++;
    if (String(user.joiningDate || "").trim()) filled++;

    const calculated = Math.round((filled * 100) / total);
    return Math.max(safeStored, calculated);
  }

  getAvatarText(): string {
    const name = this.getDisplayName();
    return name?.charAt(0)?.toUpperCase() || "C";
  }

  get unreadNotifications(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  get totalNotificationPages(): number {
    return Math.max(
      1,
      Math.ceil(this.notifications.length / this.notificationPageSize),
    );
  }

  get pagedNotifications(): ChefNotification[] {
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

  markAllRead(): void {
    this.notifications = this.notifications.map((n) => ({
      ...n,
      read: true,
    }));
  }

  getNotificationTime(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return uppercaseMeridiem(
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  }

  getNotificationSeverityClass(severity: "info" | "warning" | "error"): string {
    if (severity === "warning") return "severity-warning";
    if (severity === "error") return "severity-error";
    return "severity-info";
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setTheme(this.isDarkMode);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.profileDropdownOpen &&
      this.profileContainer &&
      !this.profileContainer.nativeElement.contains(event.target)
    ) {
      this.profileDropdownOpen = false;
    }
    if (
      this.notificationDropdownOpen &&
      this.notificationContainer &&
      !this.notificationContainer.nativeElement.contains(event.target)
    ) {
      this.notificationDropdownOpen = false;
    }
  }

  @HostListener("document:keydown.escape")
  closeDropdowns(): void {
    this.profileDropdownOpen = false;
    this.notificationDropdownOpen = false;
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    const mobile = window.innerWidth < 1024;
    if (mobile !== this.isMobileView) {
      this.isMobileView = mobile;
      this.isSidebarCollapsed = mobile;
      this.profileDropdownOpen = false;
      this.notificationDropdownOpen = false;
    }
  }

  @HostListener("window:storage", ["$event"])
  onStorageThemeChange(event: StorageEvent): void {
    if (event.key !== "theme" && event.key !== "cafe_theme") return;
    this.themeService.syncFromStorage();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  @HostListener("window:theme-changed", ["$event"])
  onThemeChanged(event: Event): void {
    const customEvent = event as CustomEvent<{ dark: boolean }>;
    if (typeof customEvent?.detail?.dark !== "boolean") {
      this.themeService.syncFromStorage();
      this.isDarkMode = this.themeService.isDarkMode();
    } else {
      this.isDarkMode = customEvent.detail.dark;
    }
  }

  private bindOrderNotifications(): void {
    const userId = this.currentUser?.id;
    const cafeId = this.currentUser?.cafeId;
    this.currentWsBindingKey = this.getWsBindingKey();

    if (userId) {
      this.wsUserNotifDest = `/user/${userId}/queue/notifications`;
      this.userNotifSub = this.webSocketService
        .watchDestination<any>(this.wsUserNotifDest)
        .subscribe({
          next: (payload) =>
            this.ngZone.run(() => this.pushNotification(payload)),
        });

      this.wsGlobalNotifDest = "/user/queue/notifications";
      this.globalNotifSub = this.webSocketService
        .watchDestination<any>(this.wsGlobalNotifDest)
        .subscribe({
          next: (payload) =>
            this.ngZone.run(() => this.pushNotification(payload)),
        });
    }

    if (!cafeId) return;

    this.wsOrderDest = `/topic/chef/${cafeId}`;
    this.orderNotifSub = this.webSocketService
      .watchDestination<any>(this.wsOrderDest)
      .subscribe({
        next: (payload) =>
          this.ngZone.run(() => this.pushNotification(payload)),
      });
  }

  private rebindOrderNotifications(): void {
    this.unbindOrderNotifications();
    this.bindOrderNotifications();
  }

  private unbindOrderNotifications(): void {
    this.orderNotifSub?.unsubscribe();
    this.userNotifSub?.unsubscribe();
    this.globalNotifSub?.unsubscribe();
    this.orderNotifSub = undefined;
    this.userNotifSub = undefined;
    this.globalNotifSub = undefined;

    if (this.wsOrderDest) {
      this.webSocketService.unsubscribe(this.wsOrderDest);
      this.wsOrderDest = null;
    }
    if (this.wsUserNotifDest) {
      this.webSocketService.unsubscribe(this.wsUserNotifDest);
      this.wsUserNotifDest = null;
    }
    if (this.wsGlobalNotifDest) {
      this.webSocketService.unsubscribe(this.wsGlobalNotifDest);
      this.wsGlobalNotifDest = null;
    }
    this.currentWsBindingKey = null;
  }

  private getWsBindingKey(): string {
    const userId = this.currentUser?.id ?? "no-user";
    const cafeId = this.currentUser?.cafeId ?? "no-cafe";
    return `${userId}:${cafeId}`;
  }

  private pushNotification(payload: any): void {
    const title = payload?.title || "New Order";
    const message =
      payload?.message ||
      payload?.description ||
      "A new order needs your attention.";
    const severity = (payload?.severity || "info") as
      | "info"
      | "warning"
      | "error";
    const timestamp = payload?.timestamp || new Date().toISOString();

    const notification: ChefNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      message,
      severity,
      timestamp,
      read: false,
    };

    const fingerprint = `${title}|${message}|${timestamp}`;
    const exists = this.notifications.some(
      (n) => `${n.title}|${n.message}|${n.timestamp}` === fingerprint,
    );
    if (exists) return;

    this.notifications = [notification, ...this.notifications].slice(0, 50);
    this.notificationCurrentPage = 1;
  }

  private resolveProfileImage(user: any): string {
    const raw = user?.profileImageUrl || "";
    if (!raw) return "";
    const resolved = this.apiService.resolveImageUrl(raw);
    return resolved || "";
  }

  private refreshProfileFromDb(): void {
    forkJoin({
      basic: this.apiService
        .getCustomerProfile()
        .pipe(catchError(() => of(null))),
      full: this.apiService.getMyFullProfile().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ basic, full }) => {
        if (!this.currentUser) return;
        const firstName =
          basic?.firstName || full?.firstName || this.currentUser.firstName;
        const lastName =
          basic?.lastName || full?.lastName || this.currentUser.lastName;
        const updated = {
          ...this.currentUser,
          firstName,
          lastName,
          displayName:
            basic?.displayName ||
            full?.displayName ||
            this.currentUser.displayName ||
            `${firstName} ${lastName}`.trim(),
          phoneNumber:
            basic?.phoneNumber ||
            full?.phoneNumber ||
            this.currentUser.phoneNumber,
          govtIdType:
            basic?.govtIdType ||
            full?.govtIdType ||
            this.currentUser.govtIdType,
          govtIdNumber:
            basic?.govtIdNumber ||
            full?.govtIdNumber ||
            this.currentUser.govtIdNumber,
          govtIdFileName:
            basic?.govtIdFileName ||
            full?.govtIdFileName ||
            this.currentUser.govtIdFileName,
          govtIdContentType:
            basic?.govtIdContentType ||
            full?.govtIdContentType ||
            this.currentUser.govtIdContentType,
          govtIdDocumentPath:
            basic?.govtIdDocumentPath ||
            full?.govtIdDocumentPath ||
            this.currentUser.govtIdDocumentPath,
          govtIdFileSize:
            basic?.govtIdFileSize ??
            full?.govtIdFileSize ??
            this.currentUser.govtIdFileSize,
          profileImageUrl:
            basic?.profileImageUrl || this.currentUser.profileImageUrl,
          profileCompletionPercentage:
            basic?.profileCompletionPercentage ??
            full?.completionPercentage ??
            this.currentUser.profileCompletionPercentage,
          isProfileComplete:
            (basic?.profileCompletionPercentage ??
              full?.completionPercentage ??
              this.currentUser.profileCompletionPercentage) >= 100,
          lastLogin: basic?.lastLogin || this.currentUser.lastLogin,
        };
        const changed =
          JSON.stringify(updated) !== JSON.stringify(this.currentUser);
        this.currentUser = updated;
        if (changed) {
          this.authService.updateUserData(updated);
        }
        this.profileImage = this.resolveProfileImage(updated);
      },
    });
  }
}
