import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "@core/auth/auth.service";
import { NotificationService } from "@core/services/notification.service";

@Component({
  selector: "app-admin-profile",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-hero">
        <div class="avatar-wrap">
          <img
            *ngIf="profileImage"
            [src]="profileImage"
            alt="Admin Profile"
            class="avatar"
          />
          <div *ngIf="!profileImage" class="avatar avatar-fallback">{{ getInitial() }}</div>
          <label class="upload-btn">
            <input type="file" accept="image/*" (change)="onImageChange($event)" />
            Change Photo
          </label>
          <button class="remove-btn" *ngIf="profileImage" (click)="removeImage()">Remove</button>
        </div>
        <div class="hero-info">
          <h1>Admin Profile</h1>
          <p>Manage your account information and appearance settings.</p>
        </div>
      </div>

      <div class="card-grid">
        <div class="card">
          <h2>Basic Info</h2>
          <label>Username</label>
          <input [(ngModel)]="username" type="text" />

          <label>Email</label>
          <input [(ngModel)]="email" type="email" />

          <label>Display Name</label>
          <input [(ngModel)]="displayName" type="text" />
        </div>

        <div class="card">
          <h2>Preferences</h2>
          <label>Theme</label>
          <select [(ngModel)]="theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>

          <label>Auto Refresh (seconds)</label>
          <input [(ngModel)]="refreshSeconds" type="number" min="5" max="120" />

          <label class="toggle">
            <input type="checkbox" [(ngModel)]="showNotifications" />
            Show admin notifications
          </label>
        </div>
      </div>

      <div class="actions">
        <button class="primary" (click)="save()">Save Profile</button>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-container { padding: 1rem; color: #0f172a; }
      .profile-hero {
        display: flex; gap: 1rem; align-items: center;
        background: linear-gradient(135deg, #0f172a, #1e293b);
        border-radius: 16px; padding: 1rem; margin-bottom: 1rem; color: #f8fafc;
      }
      .avatar-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
      .avatar {
        width: 88px; height: 88px; border-radius: 999px; object-fit: cover;
        border: 3px solid #93c5fd; background: #1d4ed8;
      }
      .avatar-fallback {
        display: flex; align-items: center; justify-content: center;
        font-size: 1.6rem; font-weight: 700; color: #fff;
      }
      .upload-btn, .remove-btn {
        border: none; border-radius: 8px; padding: 0.35rem 0.65rem; font-size: 0.8rem; cursor: pointer;
      }
      .upload-btn { background: #2563eb; color: #fff; position: relative; overflow: hidden; }
      .upload-btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
      .remove-btn { background: #b91c1c; color: #fff; }
      .hero-info h1 { margin: 0 0 0.25rem 0; font-size: 1.3rem; }
      .hero-info p { margin: 0; color: #cbd5e1; }
      .card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
      .card { background: #fff; border: 1px solid #dbe4f0; border-radius: 12px; padding: 1rem; }
      .card h2 { margin: 0 0 0.6rem 0; font-size: 1rem; }
      label { display: block; margin: 0.45rem 0 0.25rem; font-weight: 600; color: #334155; }
      input, select {
        width: 100%; border: 1px solid #cbd5e1; border-radius: 8px;
        padding: 0.45rem 0.6rem; color: #0f172a; background: #fff;
      }
      .toggle { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.6rem; }
      .toggle input { width: auto; }
      .actions { margin-top: 1rem; display: flex; justify-content: flex-end; }
      .primary {
        border: none; border-radius: 10px; padding: 0.5rem 0.8rem;
        background: linear-gradient(135deg, #2563eb, #4338ca); color: #fff; cursor: pointer;
      }
      @media (max-width: 900px) {
        .profile-hero { flex-direction: column; align-items: flex-start; }
        .card-grid { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class AdminProfileComponent implements OnInit {
  username = "";
  email = "";
  displayName = "";
  profileImage = "";
  theme: "light" | "dark" = "light";
  refreshSeconds = 15;
  showNotifications = true;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.username = user?.username || "admin";
    this.email = user?.email || "admin@digitalcafe.com";
    this.displayName = localStorage.getItem("admin_display_name") || this.username;
    this.profileImage = localStorage.getItem("admin_profile_image") || "";
    this.theme = (localStorage.getItem("cafe_theme") as "light" | "dark") || "light";
    this.refreshSeconds = Number(localStorage.getItem("admin_refresh_seconds") || 15);
    this.showNotifications = (localStorage.getItem("admin_enable_toasts") || "true") === "true";
  }

  getInitial(): string {
    return (this.displayName || this.username || "A").charAt(0).toUpperCase();
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.profileImage = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.profileImage = "";
  }

  save(): void {
    localStorage.setItem("admin_display_name", this.displayName || this.username);
    localStorage.setItem("admin_profile_image", this.profileImage);
    localStorage.setItem("cafe_theme", this.theme);
    localStorage.setItem("theme", this.theme);
    localStorage.setItem("admin_refresh_seconds", String(Math.max(5, Math.min(120, Number(this.refreshSeconds) || 15))));
    localStorage.setItem("admin_enable_toasts", String(this.showNotifications));

    if (this.theme === "dark") {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.documentElement.classList.remove("dark");
    }

    const user = this.authService.currentUserValue;
    if (user) {
      this.authService.updateUserData({
        ...user,
        username: this.username || user.username,
        email: this.email || user.email,
      });
    }

    this.notificationService.success("Admin profile updated successfully.");
  }
}
