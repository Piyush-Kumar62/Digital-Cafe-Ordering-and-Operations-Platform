import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { ApiService } from "@core/services/api.service";
import { ThemeService } from "@core/services/theme.service";
import { AlertService } from "@core/services/alert.service";
import { User } from "@shared/models/auth.model";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  isAuthenticated = false;
  user: User | null = null;
  dashboardRoute = "/";
  isDarkMode = false;
  isLandingPage = false;
  isLegalPage = false;
  userMenuOpen = false;
  avatarUrl = "";
  private avatarLoadFailed = false;
  private avatarVersion = Date.now();
  roleLabel = "Account";
  profileRoute = "/auth/login";
  cafesRoute = "/cafes";

  @ViewChild("userMenuRef", { static: false })
  userMenuRef?: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    private themeService: ThemeService,
    private alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.updateRouteContext(this.router.url);

    this.authService.currentUser.subscribe((user) => {
      this.user = user;
      this.isAuthenticated = !!user;
      if (user) {
        this.dashboardRoute = this.authService.getRoleDashboardRoute();
        this.roleLabel = this.getRoleLabel(user);
        this.profileRoute = this.getProfileRoute(user);
        this.cafesRoute = this.authService.isCustomer()
          ? "/customer/browse-cafes"
          : "/cafes";
        this.refreshAvatar(user);
      } else {
        this.avatarUrl = "";
        this.avatarLoadFailed = false;
        this.roleLabel = "Account";
        this.profileRoute = "/auth/login";
        this.cafesRoute = "/cafes";
      }
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateRouteContext(event.urlAfterRedirects);
      }
    });

    // Load theme preference from localStorage
    this.themeService.syncFromStorage();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  scrollToTop(): void {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }

  scrollToFragment(fragment: string): void {
    setTimeout(() => {
      const element = document.getElementById(fragment);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }

  logout(): void {
    this.confirmLogout();
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
    if (typeof customEvent?.detail?.dark === "boolean") {
      this.isDarkMode = customEvent.detail.dark;
    } else {
      this.themeService.syncFromStorage();
      this.isDarkMode = this.themeService.isDarkMode();
    }
  }

  private updateRouteContext(url: string): void {
    const pathOnly = url.split("?")[0].split("#")[0];
    this.isLandingPage = this.shouldUseLandingNavbar(pathOnly);
    this.isLegalPage = this.isLegalRoute(pathOnly);
  }

  private shouldUseLandingNavbar(path: string): boolean {
    if (path === "" || path === "/") {
      return true;
    }

    return (
      path.startsWith("/cafes") ||
      path.startsWith("/about") ||
      path.startsWith("/contact") ||
      path.startsWith("/auth/")
    );
  }

  private isLegalRoute(path: string): boolean {
    return (
      path.startsWith("/privacy") ||
      path.startsWith("/terms") ||
      path.startsWith("/cookie-policy") ||
      path.startsWith("/refund-policy") ||
      path.startsWith("/data-deletion")
    );
  }

  getDisplayName(): string {
    if (!this.user) return "";

    const username = this.user.username;

    // If email → extract name
    if (username.includes("@")) {
      const namePart = username.split("@")[0];

      return namePart
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return username;
  }

  get hasAvatar(): boolean {
    return !!this.avatarUrl && !this.avatarLoadFailed;
  }

  onAvatarError(): void {
    this.avatarLoadFailed = true;
  }

  private refreshAvatar(user: User): void {
    const resolved = this.apiService.resolveImageUrl(user.profileImageUrl || "");
    if (!resolved) {
      this.avatarUrl = "";
      this.avatarLoadFailed = false;
      return;
    }
    this.avatarVersion = Date.now();
    this.avatarUrl = `${resolved}${resolved.includes("?") ? "&" : "?"}v=${this.avatarVersion}`;
    this.avatarLoadFailed = false;
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  private async confirmLogout(): Promise<void> {
    const ok = await this.alertService.confirm(
      "Confirm logout",
      "Are you sure you want to log out?",
    );
    if (!ok) return;
    this.authService.logout();
    this.userMenuOpen = false;
    this.closeMenu();
    this.alertService.success("Logged out", "You have been signed out successfully.");
    this.router.navigate(["/auth/login"]);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen) return;
    const target = event.target as HTMLElement;
    if (this.userMenuRef?.nativeElement?.contains(target)) return;
    this.userMenuOpen = false;
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.userMenuOpen = false;
  }

  private getRoleLabel(user: User): string {
    const raw = user?.roles?.[0] || "ACCOUNT";
    return raw
      .replace("ROLE_", "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private getProfileRoute(user: User): string {
    const role = (user?.roles?.[0] || "").replace("ROLE_", "");
    switch (role) {
      case "ADMIN":
        return "/admin/profile";
      case "CAFE_OWNER":
        return "/owner/settings";
      case "CHEF":
        return "/chef/profile";
      case "WAITER":
        return "/waiter/profile";
      case "CUSTOMER":
        return "/customer/profile";
      default:
        return this.dashboardRoute || "/";
    }
  }
}

