import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { User } from "@shared/models/auth.model";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <a routerLink="/" class="brand-link">
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
              (click)="closeMenu()"
              >Home</a
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
                <span class="user-name">{{ user.username }}</span>
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
  `,
  styles: [
    `
      .navbar {
        background: #1f2937;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .navbar-container {
        width: 100%;
        padding: 1rem 0;
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
        color: #dc2626;
        transition: color 0.3s;
      }

      .brand-link:hover {
        color: #ef4444;
      }

      .brand-name {
        font-family: "Poppins", sans-serif;
      }

      .navbar-right {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding-right: 1rem;
      }

      .navbar-menu {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .nav-link {
        text-decoration: none;
        color: #d1d5db;
        font-weight: 500;
        transition: color 0.3s;
        padding: 0.5rem 1rem;
        border-radius: 6px;
      }

      .nav-link:hover {
        color: #ffffff;
        background-color: #374151;
      }

      .nav-link.active {
        color: #ffffff;
        background-color: #374151;
        font-weight: 600;
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
        background-color: #dc2626;
        color: white;
        border: none;
        padding: 0.5rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .btn-logout:hover {
        background-color: #b91c1c;
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
        background: none;
        border: 2px solid #4b5563;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s;
      }

      .theme-toggle:hover {
        border-color: #dc2626;
        background-color: #374151;
      }

      .theme-icon {
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      @media (max-width: 768px) {
        .navbar-right {
          gap: 0.5rem;
        }

        .navbar-menu {
          position: fixed;
          top: 70px;
          left: -100%;
          width: 100%;
          height: calc(100vh - 70px);
          background: #1f2937;
          flex-direction: column;
          align-items: flex-start;
          padding: 2rem;
          transition: left 0.3s;
        }

        .navbar-menu.active {
          left: 0;
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

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      this.user = user;
      this.isAuthenticated = !!user;
      if (user) {
        this.dashboardRoute = this.authService.getRoleDashboardRoute();
      }
    });

    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem("theme");
    this.isDarkMode = savedTheme === "dark";
    this.applyTheme();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
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

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }
}
