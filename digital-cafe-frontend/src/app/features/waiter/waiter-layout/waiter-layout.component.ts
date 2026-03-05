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
import { ThemeService } from "@core/services/theme.service";
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

  private routerEventsSub?: Subscription;
  private currentUserSub?: Subscription;
  private orderNotifSub?: Subscription;
  private wsOrderDest: string | null = null;

  @ViewChild("profileContainer", { static: false })
  profileContainer!: ElementRef;
  @ViewChild("notificationContainer", { static: false })
  notificationContainer!: ElementRef;

  navigationItems: WaiterNavItem[] = [
    { label: "Dashboard", icon: "bi-speedometer2", route: "/waiter/dashboard" },
    { label: "My Profile", icon: "bi-person-circle", route: "/waiter/profile" },
  ];

  constructor(
    private authService: AuthService,
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
    this.profileImage = localStorage.getItem("waiter_profile_image") || "";
    this.currentUserSub = this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
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
    const u = this.currentUser;
    if (u?.firstName && u?.lastName) return `${u.firstName} ${u.lastName}`;
    return u?.name || u?.username || "Waiter";
  }

  getUserEmail(): string {
    return this.currentUser?.email || "";
  }

  getAvatarText(): string {
    return this.getDisplayName().charAt(0).toUpperCase() || "W";
  }

  get unreadNotifications(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  getNotifTime(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    const cafeId = this.currentUser?.cafeId;
    if (!cafeId) return;

    this.wsOrderDest = `/topic/waiter/${cafeId}`;
    this.orderNotifSub = this.webSocketService
      .watchDestination<any>(this.wsOrderDest)
      .subscribe({
        next: (payload) =>
          this.ngZone.run(() => this.pushNotification(payload)),
      });
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

    this.notifications = [notification, ...this.notifications].slice(0, 20);
  }
}
