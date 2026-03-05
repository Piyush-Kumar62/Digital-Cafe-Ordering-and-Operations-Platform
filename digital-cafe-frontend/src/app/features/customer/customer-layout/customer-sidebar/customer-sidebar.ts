import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-customer-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./customer-sidebar.html",
  styleUrls: ["./customer-sidebar.scss"],
})
export class CustomerSidebarComponent implements OnInit {
  isCollapsed = false;
  menuItems = [
    { name: "Dashboard", icon: "dashboard", path: "/customer/dashboard" },
    {
      name: "Browse Cafés",
      icon: "storefront",
      path: "/customer/browse-cafes",
    },
    { name: "My Bookings", icon: "book_online", path: "/customer/my-bookings" },
    {
      name: "My Orders",
      icon: "receipt_long",
      path: "/customer/order-tracking",
    },
    { name: "Payments", icon: "payment", path: "/customer/payments" },
    { name: "My Profile", icon: "person", path: "/customer/profile" },
    {
      name: "Notifications",
      icon: "notifications",
      path: "/customer/notifications",
    },
  ];

  constructor() {}

  ngOnInit(): void {}

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
