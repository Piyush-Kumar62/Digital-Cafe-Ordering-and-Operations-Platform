import { Component, HostListener, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { ThemeService } from "@core/services/theme.service";
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.updateRouteContext(this.router.url);

    this.authService.currentUser.subscribe((user) => {
      this.user = user;
      this.isAuthenticated = !!user;
      if (user) {
        this.dashboardRoute = this.authService.getRoleDashboardRoute();
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
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(["/auth/login"]);
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
    this.isLandingPage = pathOnly === "" || pathOnly === "/";
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
}

