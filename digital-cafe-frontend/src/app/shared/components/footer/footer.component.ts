import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { UserRole } from "@shared/models/auth.model";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  navigateExploreCafes(event: Event): void {
    event.preventDefault();

    if (this.authService.isAuthenticated && this.authService.isCustomer()) {
      this.navigateTop("/customer/browse-cafes");
      return;
    }

    this.navigateTop("/cafes");
  }

  navigateBookTable(event: Event): void {
    event.preventDefault();

    const targetPath = "/customer/booking";
    if (!this.authService.isAuthenticated) {
      this.router.navigate(["/auth/login"], {
        queryParams: { returnUrl: targetPath },
      });
      return;
    }

    if (!this.authService.hasRole(UserRole.CUSTOMER)) {
      this.navigateTop(this.authService.getRoleDashboardRoute());
      return;
    }

    this.navigateTop(targetPath);
  }

  navigateGetStarted(event: Event): void {
    event.preventDefault();

    if (!this.authService.isAuthenticated) {
      this.navigateTop("/auth/register");
      return;
    }

    this.navigateTop(this.authService.getRoleDashboardRoute());
  }

  navigateLegal(path: string, event: Event): void {
    event.preventDefault();

    this.navigateTop(path);
  }

  navigateTopLink(path: string, event: Event): void {
    event.preventDefault();
    this.navigateTop(path);
  }

  navigateLandingSection(fragment: string, event: Event): void {
    event.preventDefault();

    this.router.navigate(["/"], { fragment }).finally(() => {
      this.scrollToFragment(fragment);
    });
  }

  private forceTopScroll(): void {
    this.scrollToTop();
    requestAnimationFrame(() => this.scrollToTop());
    setTimeout(() => this.scrollToTop(), 0);
  }

  private navigateTop(path: string): void {
    const currentPath = this.router.url.split("?")[0].split("#")[0];
    const navigation =
      currentPath === path ? Promise.resolve(true) : this.router.navigateByUrl(path);

    navigation.finally(() => this.forceTopScroll());
  }

  private scrollToTop(): void {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });

      const scrollContainers = document.querySelectorAll<HTMLElement>(
        ".content-container, .main-content, main, .legal-page",
      );
      scrollContainers.forEach((el) => {
        el.scrollTop = 0;
      });
    });
  }

  private scrollToFragment(fragment: string): void {
    this.tryScrollToElement(fragment, 0);
  }

  private tryScrollToElement(fragment: string, attempt: number): void {
    const target = document.getElementById(fragment);
    if (target) {
      this.scrollElementIntoView(target);
      return;
    }

    if (attempt >= 80) return;
    setTimeout(() => this.tryScrollToElement(fragment, attempt + 1), 50);
  }

  private scrollElementIntoView(target: HTMLElement): void {
    const navbar = document.querySelector(".navbar") as HTMLElement | null;
    const navbarHeight = navbar?.offsetHeight ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "auto",
    });
  }
}

