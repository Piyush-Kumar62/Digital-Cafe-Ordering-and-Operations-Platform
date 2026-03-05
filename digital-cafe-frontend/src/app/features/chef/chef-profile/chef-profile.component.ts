import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "@core/auth/auth.service";

@Component({
  selector: "app-chef-profile",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./chef-profile.component.html",
  styleUrls: ["./chef-profile.component.scss"],
})
export class ChefProfileComponent implements OnInit {
  currentUser: any;
  profileImage = "";

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.profileImage = localStorage.getItem("chef_profile_image") || "";
  }

  getDisplayName(): string {
    return this.currentUser?.name || this.currentUser?.username || "Chef";
  }

  getUserEmail(): string {
    return this.currentUser?.email || "";
  }

  getAvatarText(): string {
    const name = this.getDisplayName();
    return name?.charAt(0)?.toUpperCase() || "C";
  }

  getRoleLabel(): string {
    const role = this.currentUser?.roles?.[0] || "ROLE_CHEF";
    return String(role).replace("ROLE_", "");
  }

  getJoinDate(): string {
    const date = this.currentUser?.createdAt;
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getCafeName(): string {
    return this.currentUser?.cafeName || "Assigned Café";
  }
}
