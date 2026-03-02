import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";

@Component({
  selector: "app-waiter-layout",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./waiter-layout.component.html",
  styleUrls: ["./waiter-layout.component.scss"],
})
export class WaiterLayoutComponent implements OnInit {
  currentUser: any;
  profileDropdownOpen = false;
  profileImage = "";

  @ViewChild("profileContainer", { static: false })
  profileContainer!: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.profileImage = localStorage.getItem("waiter_profile_image") || "";
  }

  getDisplayName(): string {
    return this.currentUser?.name || this.currentUser?.username || "Waiter";
  }

  getUserEmail(): string {
    return this.currentUser?.email || "";
  }

  getAvatarText(): string {
    const name = this.currentUser?.name || this.currentUser?.username || "";
    return name.charAt(0).toUpperCase() || "W";
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/auth/login"]);
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
}
