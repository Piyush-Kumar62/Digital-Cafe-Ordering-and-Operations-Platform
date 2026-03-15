import { Component } from "@angular/core";
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
export class RegisterRoleComponent {
  readonly panelImage =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=80";
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
}
