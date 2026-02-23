import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { User } from "@shared/models/auth.model";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" [class.landing-navbar]="isLandingPage">
      <div class="navbar-container">
        <div class="navbar-brand">
          <a routerLink="/" class="brand-link">
            <span class="brand-logo">
              <img
                src="assets/digital-cafe-logo.png"
                alt="Digital Café Logo"
                class="logo-img"
              />
            </span>
            <span class="brand-name">Digital Café</span>
          </a>
        </div>

        <div class="navbar-right">
          <div class="navbar-menu" [class.active]="menuOpen">
            <!-- Public Navigation Links -->
            <a
              routerLink="/"
              class="nav-link"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="closeMenu(); scrollToTop()"
              >Home</a
            >
            <a
              routerLink="/"
              fragment="features"
              class="nav-link"
              (click)="closeMenu(); scrollToFragment('features')"
              >Features</a
            >
            <a
              routerLink="/"
              fragment="how-it-works"
              class="nav-link"
              (click)="closeMenu(); scrollToFragment('how-it-works')"
              >How It Works</a
            >
            <a
              routerLink="/"
              fragment="cafes"
              class="nav-link"
              (click)="closeMenu(); scrollToFragment('cafes')"
              >Cafés</a
            >
            <a
              routerLink="/about"
              class="nav-link"
              routerLinkActive="active"
              (click)="closeMenu()"
              >About</a
            >
            <a
              routerLink="/contact"
              class="nav-link"
              routerLinkActive="active"
              (click)="closeMenu()"
              >Contact</a
            >

            <ng-container *ngIf="!isAuthenticated">
              <a routerLink="/auth/login" class="nav-link" (click)="closeMenu()"
                >Login</a
              >
              <a
                routerLink="/auth/register"
                class="nav-link"
                (click)="closeMenu()"
                >Register</a
              >
            </ng-container>

            <ng-container *ngIf="isAuthenticated && user">
              <a
                [routerLink]="dashboardRoute"
                class="nav-link"
                (click)="closeMenu()"
                >Dashboard</a
              >
              <div class="user-menu">
                <div class="user-avatar">
                  {{ getDisplayName().charAt(0) }}
                </div>

                <span class="user-name">
                  {{ getDisplayName() }}
                </span>

                <button class="btn-logout" (click)="logout()">Logout</button>
              </div>
            </ng-container>
          </div>

          <button
            class="theme-toggle"
            (click)="toggleTheme()"
            [attr.aria-label]="
              isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'
            "
          >
            <span class="theme-icon">{{ isDarkMode ? "☀️" : "🌙" }}</span>
          </button>

          <button class="menu-toggle" (click)="toggleMenu()">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
    <div
      class="navbar-spacer"
      [class.landing-spacer]="isLandingPage"
      aria-hidden="true"
    ></div>
  `,
  styles: [
    `
      .navbar {
        background:
          linear-gradient(120deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 55%, rgba(51, 65, 85, 0.9) 100%);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(148, 163, 184, 0.22);
        box-shadow: 0 12px 28px rgba(2, 6, 23, 0.35);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        width: 100%;
        z-index: 1000;
        isolation: isolate;
        overflow: hidden;
      }

      .navbar-spacer {
        height: 76px;
        width: 100%;
        flex: 0 0 auto;
        background: linear-gradient(
          120deg,
          rgba(15, 23, 42, 0.95) 0%,
          rgba(30, 41, 59, 0.95) 55%,
          rgba(51, 65, 85, 0.9) 100%
        );
        border-bottom: 1px solid rgba(148, 163, 184, 0.22);
      }

      .navbar.landing-navbar + .navbar-spacer {
        background: linear-gradient(
          120deg,
          rgba(59, 50, 142, 0.9) 0%,
          rgba(86, 46, 150, 0.9) 55%,
          rgba(122, 40, 138, 0.88) 100%
        );
        border-bottom: 1px solid rgba(216, 180, 254, 0.28);
      }

      .navbar-spacer.landing-spacer {
        height: 0;
        border: 0;
        background: transparent;
      }

      .navbar.landing-navbar {
        background:
          linear-gradient(120deg, rgba(79, 70, 229, 0.32) 0%, rgba(147, 51, 234, 0.28) 55%, rgba(219, 39, 119, 0.24) 100%);
        backdrop-filter: blur(16px) saturate(135%);
        -webkit-backdrop-filter: blur(16px) saturate(135%);
        border-bottom: 0;
        box-shadow: none;
      }

      .navbar.landing-navbar::before {
        content: none;
      }

      .navbar-container {
        width: 100%;
        padding: 0.82rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .navbar-brand {
        font-size: 1.5rem;
        font-weight: 700;
        padding-left: 1rem;
      }

      .brand-link {
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.62rem;
        transition: transform 0.25s ease, filter 0.25s ease;
      }

      .brand-link:hover {
        transform: translateY(-2px);
        filter: brightness(1.08);
      }

      .brand-logo {
        width: 44px;
        height: 44px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: linear-gradient(160deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.75));
        box-shadow:
          0 8px 18px rgba(2, 6, 23, 0.32),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .navbar.landing-navbar .brand-logo {
        border-color: rgba(255, 255, 255, 0.28);
        background: linear-gradient(160deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.06));
        box-shadow:
          0 8px 18px rgba(39, 15, 96, 0.28),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      .brand-logo .logo-img {
        height: 32px;
        width: auto;
        max-width: 32px;
        min-width: 30px;
        display: block;
        object-fit: contain;
      }

      .brand-name {
        font-family: "Poppins", sans-serif;
        background: linear-gradient(
          135deg,
          #fbbf24 0%,
          #f59e0b 50%,
          #fbbf24 100%
        );
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 700;
        animation: shimmer 3s linear infinite;
        line-height: 1;
      }

      .navbar.landing-navbar .brand-name {
        background: none;
        -webkit-background-clip: border-box;
        background-clip: border-box;
        -webkit-text-fill-color: #ffffff;
        color: #ffffff;
        text-shadow:
          0 1px 0 rgba(255, 255, 255, 0.18),
          0 8px 22px rgba(76, 29, 149, 0.45);
      }

      @keyframes shimmer {
        to {
          background-position: 200% center;
        }
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #dc2626, #ef4444);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }

      .user-menu {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .user-name {
        color: #e5e7eb;
        font-weight: 500;
      }

      .navbar-right {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding-right: 1rem;
      }

      .navbar-menu {
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }

      .nav-link {
        text-decoration: none;
        color: #e2e8f0;
        font-weight: 600;
        transition:
          color 0.24s ease,
          background-color 0.24s ease,
          transform 0.24s ease,
          box-shadow 0.24s ease,
          border-color 0.24s ease;
        padding: 0.5rem 0.8rem;
        border-radius: 999px;
        letter-spacing: 0.01em;
        border: 1px solid transparent;
        position: relative;
        overflow: hidden;
        isolation: isolate;
      }

      .navbar.landing-navbar .nav-link {
        color: #f8faff;
        border-color: rgba(255, 255, 255, 0.08);
      }

      .nav-link::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background:
          linear-gradient(125deg, rgba(59, 130, 246, 0.22), rgba(129, 140, 248, 0.2))
          padding-box;
        opacity: 0;
        transform: scale(0.96);
        transition: opacity 0.24s ease, transform 0.24s ease;
        z-index: -1;
      }

      .navbar.landing-navbar .nav-link::before {
        background: linear-gradient(130deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.06)) padding-box;
      }

      .nav-link::after {
        content: "";
        position: absolute;
        left: 14%;
        right: 14%;
        bottom: 0.24rem;
        height: 2px;
        border-radius: 999px;
        background: linear-gradient(90deg, #60a5fa, #a78bfa);
        transform: scaleX(0);
        transform-origin: center;
        transition: transform 0.24s ease;
        opacity: 0.95;
        z-index: -1;
      }

      .navbar.landing-navbar .nav-link::after {
        opacity: 0;
      }

      .nav-link:hover {
        color: #ffffff;
        border-color: rgba(96, 165, 250, 0.38);
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 10px 20px rgba(30, 64, 175, 0.24);
      }

      .navbar.landing-navbar .nav-link:hover {
        border-color: rgba(255, 255, 255, 0.32);
        background: rgba(255, 255, 255, 0.14);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.22);
      }

      .nav-link:hover::before {
        opacity: 1;
        transform: scale(1);
      }

      .nav-link:hover::after {
        transform: scaleX(1);
      }

      .nav-link.active {
        color: #ffffff;
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(79, 70, 229, 0.88));
        border-color: rgba(147, 197, 253, 0.3);
        box-shadow: 0 10px 22px rgba(37, 99, 235, 0.35);
        font-weight: 600;
      }

      .navbar.landing-navbar .nav-link.active {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.36);
        box-shadow: 0 8px 16px rgba(15, 23, 42, 0.2);
      }

      .nav-link.active::after {
        transform: scaleX(1);
      }

      .user-menu {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .user-name {
        color: #e5e7eb;
        font-weight: 500;
      }

      .btn-logout {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: white;
        border: none;
        padding: 0.48rem 1.1rem;
        border-radius: 999px;
        font-weight: 500;
        cursor: pointer;
        transition: transform 0.22s ease, box-shadow 0.22s ease, filter 0.22s ease;
      }

      .btn-logout:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 18px rgba(185, 28, 28, 0.35);
        filter: brightness(1.05);
      }

      .menu-toggle {
        display: none;
        flex-direction: column;
        gap: 4px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
      }

      .menu-toggle span {
        width: 24px;
        height: 3px;
        background-color: #e5e7eb;
        transition: all 0.3s;
      }

      .theme-toggle {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(100, 116, 139, 0.45);
        border-radius: 12px;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.22s ease;
      }

      .navbar.landing-navbar .theme-toggle {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .theme-toggle:hover {
        border-color: rgba(96, 165, 250, 0.5);
        background-color: rgba(37, 99, 235, 0.22);
        transform: translateY(-1px);
      }

      .navbar.landing-navbar .theme-toggle:hover {
        border-color: rgba(255, 255, 255, 0.42);
        background-color: rgba(255, 255, 255, 0.2);
      }

      .theme-icon {
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      @media (max-width: 768px) {
        .navbar-spacer {
          height: 74px;
        }

        .navbar-spacer.landing-spacer {
          height: 0;
        }

        .navbar-brand {
          padding-left: 0.75rem;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        .brand-logo .logo-img {
          height: 28px;
          max-width: 28px;
          min-width: 26px;
        }

        .brand-name {
          font-size: 1.2rem;
        }

        .navbar-right {
          gap: 0.5rem;
        }

        .navbar-menu {
          position: fixed;
          top: 74px;
          left: -100%;
          width: 100%;
          height: calc(100vh - 70px);
          background: linear-gradient(170deg, #0f172a 0%, #1e293b 45%, #243449 100%);
          flex-direction: column;
          align-items: flex-start;
          padding: 1.4rem 1rem 2rem;
          transition: left 0.28s ease;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
        }

        .navbar.landing-navbar .navbar-menu {
          background: linear-gradient(170deg, #312e81 0%, #581c87 48%, #7e22ce 100%);
          border-top-color: rgba(216, 180, 254, 0.3);
        }

        .navbar-menu.active {
          left: 0;
        }

        .nav-link {
          width: 100%;
          border-radius: 10px;
          padding: 0.7rem 0.8rem;
        }

        .menu-toggle {
          display: flex;
        }

        .user-menu {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
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
    const savedTheme = localStorage.getItem("cafe_theme") || localStorage.getItem("theme");
    this.isDarkMode = savedTheme === "dark";
    this.applyTheme();
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
    this.applyTheme();
  }

  private updateRouteContext(url: string): void {
    const pathOnly = url.split("?")[0].split("#")[0];
    this.isLandingPage = pathOnly === "" || pathOnly === "/";
  }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.add("dark-mode");
      localStorage.setItem("cafe_theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem("cafe_theme", "light");
      localStorage.setItem("theme", "light");
    }
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
