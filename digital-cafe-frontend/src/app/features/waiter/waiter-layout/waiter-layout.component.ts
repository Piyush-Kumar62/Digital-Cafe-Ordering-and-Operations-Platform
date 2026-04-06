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

interface WaiterNavItem {
  label: string;
  icon: string;
  route: string;
}

interface WaiterNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
  read: boolean;
}

@Component({
  selector: "app-waiter-layout",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./waiter-layout.component.html",
  styleUrls: ["./waiter-layout.component.scss"],
})
export class WaiterLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  isMobileView = false;
  currentUser: any = null;
  isDarkMode = false;
  profileDropdownOpen = false;
  notificationDropdownOpen = false;
  profileImage = "";
  notifications: WaiterNotification[] = [];
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

  navigationItems: WaiterNavItem[] = [
    { label: "Dashboard", icon: "bi-speedometer2", route: "/waiter/dashboard" },
    {
      label: "Active Orders",
      icon: "bi-list-check",
      route: "/waiter/active-orders",
    },
    {
      label: "Served History",
      icon: "bi-clock-history",
      route: "/waiter/served-history",
    },
    { label: "My Profile", icon: "bi-person-circle", route: "/waiter/profile" },
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
    const u = this.currentUser;
    const first = u?.firstName || "";
    const last = u?.lastName || "";
    const full = `${first} ${last}`.trim();
    return u?.displayName || full || u?.username || "Waiter";
  }

  getUserEmail(): string {
    return this.currentUser?.email || "";
  }

  getAvatarText(): string {
    return this.getDisplayName().charAt(0).toUpperCase() || "W";
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

  get missingProfileFields(): string[] {
    const user = this.currentUser || {};
    const missing: string[] = [];

    if (!String(user.firstName || "").trim()) missing.push("First Name");
    if (!String(user.lastName || "").trim()) missing.push("Last Name");
    if (!String(user.displayName || "").trim()) missing.push("Display Name");
    if (!String(user.phoneNumber || "").trim()) missing.push("Phone Number");
    if (!String(user.govtIdType || "").trim())
      missing.push("Government ID Type");
    if (!String(user.govtIdNumber || "").trim())
      missing.push("Government ID Number");
    if (!String(user.govtIdDocumentPath || "").trim())
      missing.push("Government ID Document");
    if (!String(user.joiningDate || "").trim()) missing.push("Joining Date");

    return missing;
  }

  hasProfileWarning(): boolean {
    return this.missingProfileFields.length > 0;
  }

  getVisibleMissingProfileFields(limit = 3): string[] {
    return this.missingProfileFields.slice(0, limit);
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

  get pagedNotifications(): WaiterNotification[] {
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

  getNotifTime(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return uppercaseMeridiem(
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  }

  getNotifSeverityClass(severity: "info" | "warning" | "error"): string {
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

    this.wsOrderDest = `/topic/waiter/${cafeId}`;
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
    const title = payload?.title || "Order Ready";
    const message =
      payload?.message ||
      payload?.description ||
      "An order is ready to be served.";
    const severity = (payload?.severity || "info") as
      | "info"
      | "warning"
      | "error";
    const timestamp = payload?.timestamp || new Date().toISOString();

    const notification: WaiterNotification = {
      id: `${Date.now()}-${Math.random()}`,
      title,
      message,
      timestamp,
      severity,
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
