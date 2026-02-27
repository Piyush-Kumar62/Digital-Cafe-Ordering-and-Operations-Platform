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

import { RouterModule, Router } from "@angular/router";
import { NavigationEnd } from "@angular/router";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";

import { AuthService } from "@core/auth/auth.service";
import { ThemeService } from "@core/services/theme.service";
import { AdminProfileService } from "../profile/admin-profile.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { AdminProfile } from "@shared/models/admin-profile.model";
import { environment } from "@environments/environment";

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
  expanded?: boolean;
  submenu?: {
    label: string;
    route: string;
  }[];
}

interface AdminHeaderNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
  read: boolean;
}

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./admin-layout.component.html",
  styleUrls: ["./admin-layout.component.scss"],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  private isMobileView = false;
  currentUser: any;
  isDarkMode = false;
  profileDropdownOpen = false;
  notificationDropdownOpen = false;
  adminProfileImage = "";
  notifications: AdminHeaderNotification[] = [];
  isDashboardRoute = false;
  private routerEventsSub?: Subscription;
  private currentUserSub?: Subscription;
  private profileWsSub?: Subscription;
  private adminNotificationSub?: Subscription;
  private adminNotificationGlobalSub?: Subscription;
  private wsDestination: string | null = null;
  private notificationDestination: string | null = null;
  private globalNotificationDestination: string | null = null;
  @ViewChild("profileContainer", { static: false })
  profileContainer!: ElementRef;
  @ViewChild("notificationContainer", { static: false })
  notificationContainer!: ElementRef;

  navigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      icon: "dashboard",
      route: "/admin/dashboard",
      active: true,
    },
    {
      label: "User Management",
      icon: "users",
      route: "/admin/users",
    },
    {
      label: "Café Management",
      icon: "store",
      route: "/admin/cafes",
    },
    {
      label: "Orders",
      icon: "shopping-cart",
      route: "/admin/orders",
    },
    {
      label: "Bookings",
      icon: "calendar",
      route: "/admin/bookings",
    },
    {
      label: "Analytics",
      icon: "chart-bar",
      route: "/admin/analytics",
    },
    {
      label: "Reports",
      icon: "document",
      route: "/admin/reports",
    },
    {
      label: "Settings",
      icon: "cog",
      route: "/admin/settings",
    },
  ];

  private readonly iconClassMap: Record<string, string> = {
    dashboard: "bi bi-speedometer2 w-6 h-6 text-lg",
    users: "bi bi-people w-6 h-6 text-lg",
    store: "bi bi-shop w-6 h-6 text-lg",
    "shopping-cart": "bi bi-cart3 w-6 h-6 text-lg",
    calendar: "bi bi-calendar-event w-6 h-6 text-lg",
    "chart-bar": "bi bi-bar-chart-line w-6 h-6 text-lg",
    document: "bi bi-file-earmark-text w-6 h-6 text-lg",
    "clipboard-list": "bi bi-card-checklist w-6 h-6 text-lg",
    cog: "bi bi-gear w-6 h-6 text-lg",
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private adminProfileService: AdminProfileService,
    private webSocketService: WebSocketService,
    private ngZone: NgZone,
  ) {
    this.themeService.syncFromStorage();
    this.isDarkMode = this.themeService.isDarkMode();
    // Check if we're on mobile and collapse sidebar
    if (typeof window !== "undefined") {
      this.isMobileView = window.innerWidth < 1024; // lg breakpoint
      this.isSidebarCollapsed = this.isMobileView;
    }
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.adminProfileImage = this.resolveImageUrl(this.currentUser?.avatarUrl || "");
    this.currentUserSub = this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.adminProfileImage = this.resolveImageUrl(user?.avatarUrl || "");
    });
    this.loadAdminProfileForHeader();
    this.bindProfileRealtimeUpdates();
    this.bindAdminNotifications();
    this.updateRouteState(this.router.url);
    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.updateRouteState(nav.urlAfterRedirects || nav.url);
      });
  }

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
    this.currentUserSub?.unsubscribe();
    this.profileWsSub?.unsubscribe();
    this.adminNotificationSub?.unsubscribe();
    this.adminNotificationGlobalSub?.unsubscribe();
    if (this.wsDestination) {
      this.webSocketService.unsubscribe(this.wsDestination);
    }
    if (this.notificationDestination) {
      this.webSocketService.unsubscribe(this.notificationDestination);
    }
    if (this.globalNotificationDestination) {
      this.webSocketService.unsubscribe(this.globalNotificationDestination);
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleSubmenu(item: NavigationItem): void {
    item.expanded = !item.expanded;
  }
  toggleProfileDropdown(): void {
    this.notificationDropdownOpen = false;
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  toggleNotificationDropdown(): void {
    this.profileDropdownOpen = false;
    this.notificationDropdownOpen = !this.notificationDropdownOpen;
    if (this.notificationDropdownOpen) {
      this.notifications = this.notifications.map((item) => ({ ...item, read: true }));
    }
  }
  goToLanding(): void {
    this.router.navigate(["/"]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/auth/login"]).catch(() => {});
  }
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const clickedInsideProfile = this.profileContainer?.nativeElement?.contains(event.target) || false;
    const clickedInsideNotification = this.notificationContainer?.nativeElement?.contains(event.target) || false;

    if (!clickedInsideProfile) {
      this.profileDropdownOpen = false;
    }
    if (!clickedInsideNotification) {
      this.notificationDropdownOpen = false;
    }
  }

  @HostListener("document:keydown.escape")
  closeDropdown() {
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

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.themeService.setTheme(this.isDarkMode);
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
    if (typeof customEvent?.detail?.dark !== "boolean") {
      this.themeService.syncFromStorage();
      this.isDarkMode = this.themeService.isDarkMode();
    } else {
      this.isDarkMode = customEvent.detail.dark;
    }
  }

  getIconClass(iconName: string): string {
    return this.iconClassMap[iconName] || "bi bi-circle w-6 h-6 text-lg";
  }

  getAvatarText(): string {
    const name = this.getDisplayName();
    return name?.charAt(0)?.toUpperCase() || "A";
  }

  getDisplayName(): string {
    const displayName = (this.currentUser?.username || "").trim();
    if (displayName) {
      return displayName;
    }
    const first = this.currentUser?.firstName || "";
    const last = this.currentUser?.lastName || "";
    const fullName = `${first} ${last}`.trim();
    if (fullName) {
      return fullName;
    }
    return "Admin";
  }

  getRoleLabel(): string {
    const role = this.currentUser?.roles?.[0] || "ROLE_ADMIN";
    return String(role).replace("ROLE_", "");
  }

  get unreadNotifications(): number {
    return this.notifications.filter((item) => !item.read).length;
  }

  getNotificationTime(timestamp: string): string {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  getNotificationSeverityClass(severity: "info" | "warning" | "error"): string {
    if (severity === "warning") {
      return "severity-warning";
    }
    if (severity === "error") {
      return "severity-error";
    }
    return "severity-info";
  }

  getIconSVG(iconName: string): string {
    const icons: { [key: string]: string } = {
      dashboard: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
      </svg>`,
      users: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
      </svg>`,
      store: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
      </svg>`,
      "shopping-cart": `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>`,
      calendar: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>`,
      "chart-bar": `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>`,
      document: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>`,
      "clipboard-list": `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
      </svg>`,
      cog: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>`,
    };
    return icons[iconName] || "";
  }

  private updateRouteState(url: string): void {
    this.isDashboardRoute = /^\/admin\/dashboard(?:\?|$|\/)?/.test(url);
  }

  private loadAdminProfileForHeader(): void {
    this.adminProfileService.getProfile().subscribe({
      next: (profile) => this.applyAdminProfileToHeader(profile),
      error: () => {},
    });
  }

  private bindProfileRealtimeUpdates(): void {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return;
    }
    this.wsDestination = `/topic/profile/${userId}`;
    this.profileWsSub = this.webSocketService
      .watchDestination<AdminProfile>(this.wsDestination)
      .subscribe({
        next: (profile) => this.ngZone.run(() => this.applyAdminProfileToHeader(profile)),
      });
  }

  private bindAdminNotifications(): void {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      return;
    }

    this.notificationDestination = `/user/${userId}/queue/notifications`;
    this.adminNotificationSub = this.webSocketService
      .watchDestination<any>(this.notificationDestination)
      .subscribe({
        next: (payload) => this.ngZone.run(() => this.pushNotification(payload)),
      });

    this.globalNotificationDestination = "/user/queue/notifications";
    this.adminNotificationGlobalSub = this.webSocketService
      .watchDestination<any>(this.globalNotificationDestination)
      .subscribe({
        next: (payload) => this.ngZone.run(() => this.pushNotification(payload)),
      });
  }

  private applyAdminProfileToHeader(profile: AdminProfile): void {
    const current = this.authService.currentUserValue;
    if (!current) {
      return;
    }
    this.authService.updateUserData({
      ...current,
      username: profile.displayName || current.username,
      firstName: profile.firstName || current.firstName,
      lastName: profile.lastName || current.lastName,
      avatarUrl: profile.profileImageUrl || "",
    });
    this.adminProfileImage = this.resolveImageUrl(profile.profileImageUrl || "");
  }

  private resolveImageUrl(value: string): string {
    if (!value) {
      return "";
    }
    if (value.startsWith("http")) {
      return value;
    }
    const backendBase = environment.apiUrl.replace("/api", "");
    return `${backendBase}${value}`;
  }

  private normalizeNotification(payload: any): AdminHeaderNotification {
    const title = payload?.title || "Platform Update";
    const message = payload?.message || payload?.description || "A new event requires your attention.";
    const severity = (payload?.severity || "info") as "info" | "warning" | "error";
    const timestamp = payload?.timestamp || new Date().toISOString();

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      message,
      severity,
      timestamp,
      read: false,
    };
  }

  private pushNotification(payload: any): void {
    const normalized = this.normalizeNotification(payload);
    const fingerprint = `${normalized.title}|${normalized.message}|${normalized.timestamp}`;
    const alreadyPresent = this.notifications.some((item) => {
      const existing = `${item.title}|${item.message}|${item.timestamp}`;
      return existing === fingerprint;
    });

    if (alreadyPresent) {
      return;
    }
    this.notifications = [normalized, ...this.notifications].slice(0, 20);
  }
}
