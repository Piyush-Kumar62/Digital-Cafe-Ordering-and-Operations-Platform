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
  panelImage = "/assets/cafe/register-role-hero.jpg";
  panelImageVisible = true;
  private readonly fallbackPanelImage = "/assets/cafe/register-role-hero.jpg";
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
  }

  ngOnDestroy(): void {
    // no-op
  }

  onPanelImageError(): void {
    if (this.panelImage !== this.fallbackPanelImage) {
      this.panelImage = this.fallbackPanelImage;
      return;
    }
    this.panelImageVisible = true;
  }
}
