import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NavbarComponent } from "../../../shared/components/navbar/navbar.component";

interface RoleOption {
  title: string;
  subtitle: string;
  description: string;
  route: string;
  iconClass: string;
  badge: string;
}

@Component({
  selector: "app-register-role",
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: "./register-role.component.html",
  styleUrl: "./register-role.component.scss",
})
export class RegisterRoleComponent implements OnInit, OnDestroy {
  panelImage = "/assets/downloads/cafes/imgs.jpg";
  panelImageVisible = true;
  private panelRotationTimer: ReturnType<typeof setInterval> | null = null;
  private panelSwapTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly rotateEveryMs = 60_000;
  private readonly panelFadeMs = 700;
  private readonly fallbackPanelImage = "/assets/downloads/cafes/imgs.jpg";
  private readonly panelImagePool: string[] = [
    "/assets/downloads/cafes/imgs.jpg",
  ];
  readonly panelImageAlt = "Coffee and breakfast spread on a rustic table";
  readonly roles: RoleOption[] = [
    {
      title: "Customer",
      subtitle: "Order food, manage profile",
      description:
        "Browse cafes, place orders, book tables, and track your dining experience.",
      route: "/auth/register/customer",
      iconClass: "bi bi-person",
      badge: "For diners",
    },
    {
      title: "Cafe Owner",
      subtitle: "Manage cafe, staff, menu",
      description:
        "Set up your cafe, manage menus and tables, and run daily operations.",
      route: "/auth/register/cafe-owner",
      iconClass: "bi bi-shop-window",
      badge: "For business",
    },
  ];

  ngOnInit(): void {
    this.panelImage = this.fallbackPanelImage;
    this.panelImageVisible = true;
    this.prefetchPanelPool();
    this.startPanelRotation();
  }

  ngOnDestroy(): void {
    if (this.panelRotationTimer) {
      clearInterval(this.panelRotationTimer);
      this.panelRotationTimer = null;
    }
    if (this.panelSwapTimer) {
      clearTimeout(this.panelSwapTimer);
      this.panelSwapTimer = null;
    }
  }

  onPanelImageError(): void {
    this.panelImage = this.fallbackPanelImage;
    this.panelImageVisible = true;
  }

  private startPanelRotation(): void {
    this.panelRotationTimer = setInterval(() => {
      this.setPanelImageForCurrentMinute();
    }, this.rotateEveryMs);
  }

  private setPanelImageForCurrentMinute(): void {
    const minuteBucket =
      Math.floor(Date.now() / this.rotateEveryMs) % this.panelImagePool.length;
    const nextImage =
      this.panelImagePool[minuteBucket] || this.fallbackPanelImage;
    void this.swapPanelImage(nextImage);
  }

  private async swapPanelImage(nextImage: string): Promise<void> {
    if (nextImage === this.panelImage) {
      return;
    }

    const ok = await this.preloadImage(nextImage);
    const target = ok ? nextImage : this.fallbackPanelImage;
    this.panelImageVisible = false;

    if (this.panelSwapTimer) {
      clearTimeout(this.panelSwapTimer);
    }

    this.panelSwapTimer = setTimeout(() => {
      this.panelImage = target;
      this.panelImageVisible = true;
    }, this.panelFadeMs);
  }

  private prefetchPanelPool(): void {
    this.panelImagePool.forEach((url) => {
      void this.preloadImage(url);
    });
  }

  private preloadImage(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
}
