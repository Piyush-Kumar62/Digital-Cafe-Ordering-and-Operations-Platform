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
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";

import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { ThemeService } from "@core/services/theme.service";
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

  private routerEventsSub?: Subscription;
  private currentUserSub?: Subscription;
  private orderNotifSub?: Subscription;
  private wsOrderDest: string | null = null;

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
    this.currentUserSub = this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.profileImage = this.resolveProfileImage(user);
    });
    this.refreshProfileFromDb();
    this.bindOrderNotifications();
    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {});
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
    this.currentUserSub?.unsubscribe();
    this.orderNotifSub?.unsubscribe();
    if (this.wsOrderDest) {
      this.webSocketService.unsubscribe(this.wsOrderDest);
    }
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
      this.notifications = this.notifications.map((n) => ({
        ...n,
        read: true,
      }));
    }
  }

  goToLanding(): void {
    this.router.navigate(["/"]);
  }

  logout(): void {
    this.authService.logout();
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

  getAvatarText(): string {
    const name = this.getDisplayName();
    return name?.charAt(0)?.toUpperCase() || "C";
  }

  get unreadNotifications(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  getNotificationTime(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    const cafeId = this.currentUser?.cafeId;
    if (!cafeId) return;

    this.wsOrderDest = `/topic/chef/${cafeId}`;
    this.orderNotifSub = this.webSocketService
      .watchDestination<any>(this.wsOrderDest)
      .subscribe({
        next: (payload) =>
          this.ngZone.run(() => this.pushNotification(payload)),
      });
  }

  private pushNotification(payload: any): void {
    const title = payload?.title || "New Order";
    const message =
      payload?.message || payload?.description || "A new order needs your attention.";
    const severity = (payload?.severity || "info") as "info" | "warning" | "error";
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

    this.notifications = [notification, ...this.notifications].slice(0, 20);
  }

  private resolveProfileImage(user: any): string {
    const raw = user?.profileImageUrl || "";
    if (!raw) return "";
    const resolved = this.apiService.resolveImageUrl(raw);
    return resolved || "";
  }

  private refreshProfileFromDb(): void {
    this.apiService.getCustomerProfile().subscribe({
      next: (profile) => {
        if (!this.currentUser) return;
        const firstName = profile?.firstName || this.currentUser.firstName;
        const lastName = profile?.lastName || this.currentUser.lastName;
        const updated = {
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
          profileCompletionPercentage:
            profile?.profileCompletionPercentage ??
            this.currentUser.profileCompletionPercentage,
          isProfileComplete:
            (profile?.profileCompletionPercentage ??
              this.currentUser.profileCompletionPercentage) >= 100,
          lastLogin: profile?.lastLogin || this.currentUser.lastLogin,
        };
        this.currentUser = updated;
        this.authService.updateUserData(updated);
        this.profileImage = this.resolveProfileImage(updated);
      },
    });
  }
}
