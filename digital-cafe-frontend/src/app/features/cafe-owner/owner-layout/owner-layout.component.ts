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
import { Subscription, interval } from "rxjs";
import { filter } from "rxjs/operators";
import { AuthService } from "@core/auth/auth.service";
import { CafeContextService } from "../services/cafe-context.service";
import { Cafe } from "@shared/models/cafe.model";

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
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
  currentUser: any;
  isDarkMode = false;
  profileDropdownOpen = false;
  profileImage = "";
  isDashboardRoute = false;
  private routerEventsSub?: Subscription;
  private profilePollSub?: Subscription;

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
    private router: Router,
    private cafeCtx: CafeContextService,
  ) {
    const savedTheme = localStorage.getItem("cafe_theme");
    this.isDarkMode = savedTheme === "dark";
    this.applyTheme();

    if (typeof window !== "undefined") {
      this.isMobileView = window.innerWidth < 1024;
      this.isSidebarCollapsed = this.isMobileView;
    }
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.profileImage = localStorage.getItem("owner_profile_image") || "";
    this.updateRouteState(this.router.url);

    this.routerEventsSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.updateRouteState(nav.urlAfterRedirects || nav.url);
        this.cafePickerOpen = false;
      });

    // Poll for profile image updates from settings page
    this.profilePollSub = interval(1500).subscribe(() => {
      const stored = localStorage.getItem("owner_profile_image") || "";
      if (stored !== this.profileImage) {
        this.profileImage = stored;
      }
    });

    // Load cafes for multi-cafe switcher
    this.cafeCtx.loadCafes().subscribe();
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
    this.profilePollSub?.unsubscribe();
    this.cafeContextSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.cafeCtx.clear();
    this.authService.logout();
    this.router.navigate(["/auth/login"]);
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem("cafe_theme", this.isDarkMode ? "dark" : "light");
  }

  private applyTheme(): void {
    if (this.isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }

  getAvatarText(): string {
    const name = this.currentUser?.name || this.currentUser?.username || "";
    return name.charAt(0).toUpperCase() || "O";
  }

  getDisplayName(): string {
    return this.currentUser?.name || this.currentUser?.username || "Café Owner";
  }

  getUserEmail(): string {
    return this.currentUser?.email || "";
  }

  getRoleLabel(): string {
    return "Café Owner";
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
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
    if (
      this.profileDropdownOpen &&
      this.profileContainer &&
      !this.profileContainer.nativeElement.contains(event.target)
    ) {
      this.profileDropdownOpen = false;
    }
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
}
