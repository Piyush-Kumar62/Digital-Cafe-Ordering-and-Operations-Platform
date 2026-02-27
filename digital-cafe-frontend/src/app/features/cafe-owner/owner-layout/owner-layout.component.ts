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

  @ViewChild("profileContainer", { static: false })
  profileContainer!: ElementRef;

  /* ✅ OWNER NAVIGATION */
  navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: "speedometer2", route: "/owner/dashboard" },
  { label: "Tables", icon: "grid-3x3-gap", route: "/owner/tables" },
  { label: "Orders", icon: "cart3", route: "/owner/orders" },
  { label: "Staff", icon: "people", route: "/owner/staff" },
  { label: "Menu", icon: "journal-text", route: "/owner/menu" },
  { label: "Settings", icon: "gear", route: "/owner/settings" },
];

  constructor(private authService: AuthService, private router: Router ) {
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
      });
  }

  
 goHome(): void {
  this.router.navigate(['/']);
}

  ngOnDestroy(): void {
    this.routerEventsSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
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
    return this.currentUser?.username?.charAt(0)?.toUpperCase() || "O";
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