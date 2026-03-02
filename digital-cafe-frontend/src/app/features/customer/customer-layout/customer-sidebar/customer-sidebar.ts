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
    { name: "Browse Cafes", icon: "storefront", path: "/cafes" },
    { name: "My Bookings", icon: "book_online", path: "/customer/booking" },
    {
      name: "My Orders",
      icon: "receipt_long",
      path: "/customer/order-tracking",
    },
    {
      name: "Track Order",
      icon: "local_shipping",
      path: "/customer/order-tracking",
    },
    { name: "Payments", icon: "payment", path: "/customer/payments" },
  ];

  constructor() {}

  ngOnInit(): void {}

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
