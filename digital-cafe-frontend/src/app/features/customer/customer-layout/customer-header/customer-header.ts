import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { ApiService } from '@core/services/api.service';
import { environment } from '@environments/environment';
import { User } from '@shared/models/auth.model';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { WebSocketService } from '@core/websocket/websocket.service';
import { Router } from '@angular/router';

type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

@Component({
  selector: 'app-customer-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './customer-header.html',
  styleUrls: ['./customer-header.scss']
})
export class CustomerHeaderComponent implements OnInit {
  readonly defaultAvatar = 'assets/branding/brand-logo.png';
  readonly backendBaseUrl = environment.apiUrl.replace('/api', '');
  user: User | null = null;
  lastLogin: Date | null = null;
  profileCompletion = 0;
  unreadNotifications = 0;
  showNotifications = false;
  showProfileMenu = false;
  notifications: HeaderNotification[] = [];
  isSavingProfile = false;
  uploadingImage = false;
  imageVersion = Date.now();
  profileForm = {
    firstName: '',
    lastName: '',
    displayName: ''
  };
  private userSubscription: Subscription | undefined;
  private destroy$ = new Subject<void>();

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private authService: AuthService,
    private apiService: ApiService,
    private webSocketService: WebSocketService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.user = user;
      if (user) {
        this.profileCompletion = user.profileCompletionPercentage || 0;
        this.lastLogin = new Date(user.lastLogin || Date.now());
      }
    });
    this.loadProfile();
    this.setupNotificationStream();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showProfileMenu = false;
    }
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) {
      this.showNotifications = false;
    }
  }

  closePopovers(): void {
    this.showNotifications = false;
    this.showProfileMenu = false;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const clickTarget = event.target as Node | null;
    if (!clickTarget) {
      return;
    }
    if (!this.elementRef.nativeElement.contains(clickTarget)) {
      this.closePopovers();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.closePopovers();
  }

  onAvatarError(event: Event): void {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = this.defaultAvatar;
  }

  get profileImageSrc(): string {
    const rawUrl = this.user?.profileImageUrl;
    if (!rawUrl) {
      return this.defaultAvatar;
    }

    const normalized = rawUrl.startsWith('http') ? rawUrl : `${this.backendBaseUrl}${rawUrl}`;
    return `${normalized}${normalized.includes('?') ? '&' : '?'}v=${this.imageVersion}`;
  }

  markAllRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.syncUnreadCount();
  }

  onProfileImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    this.uploadingImage = true;
    this.apiService.uploadCustomerProfileImage(file).subscribe({
      next: (res) => {
        if (this.user) {
          const uploadedImageUrl = res?.profileImageUrl || this.user.profileImageUrl;
          const updatedUser = { ...this.user, profileImageUrl: uploadedImageUrl };
          this.user = updatedUser;
          this.authService.updateUserData(updatedUser);
        }
        this.imageVersion = Date.now();
        this.uploadingImage = false;
      },
      error: () => {
        this.uploadingImage = false;
      }
    });
  }

  saveProfile(): void {
    if (!this.profileForm.firstName.trim() || !this.profileForm.lastName.trim() || !this.profileForm.displayName.trim()) {
      return;
    }
    this.isSavingProfile = true;
    this.apiService.updateCustomerProfile(this.profileForm).subscribe({
      next: (res) => {
        if (this.user) {
          const updatedUser: User = {
            ...this.user,
            firstName: res.firstName || this.profileForm.firstName,
            lastName: res.lastName || this.profileForm.lastName,
          };
          this.user = updatedUser;
          this.authService.updateUserData(updatedUser);
        }
        this.isSavingProfile = false;
      },
      error: () => {
        this.isSavingProfile = false;
      }
    });
  }

  private loadProfile(): void {
    this.apiService.getCustomerProfile().subscribe({
      next: (profile) => {
        this.profileForm.firstName = profile.firstName || this.user?.firstName || this.user?.username || '';
        this.profileForm.lastName = profile.lastName || this.user?.lastName || '';
        this.profileForm.displayName =
          profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || this.user?.username || '';
        if (this.user) {
          const updatedUser = {
            ...this.user,
            firstName: profile.firstName || this.user.firstName,
            lastName: profile.lastName || this.user.lastName,
            profileImageUrl: profile.profileImageUrl || this.user.profileImageUrl,
            lastLogin: profile.lastLogin || this.user.lastLogin,
          };
          this.user = updatedUser;
          this.authService.updateUserData(updatedUser);
          this.profileCompletion = profile.profileCompletionPercentage ?? this.profileCompletion;
          this.lastLogin = profile.lastLogin ? new Date(profile.lastLogin) : this.lastLogin;
          this.imageVersion = Date.now();
        }
      }
    });
  }

  get displayRole(): string {
    const role = (this.user?.roles || [])[0] || 'CUSTOMER';
    return role.replace('ROLE_', '').replace(/_/g, ' ');
  }

  private setupNotificationStream(): void {
    this.webSocketService.watchDestination<any>('/user/queue/notifications')
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        const item: HeaderNotification = {
          id: `${Date.now()}-${Math.random()}`,
          title: payload?.title || payload?.type || 'Notification',
          message: payload?.message || 'You have a new update.',
          createdAt: new Date().toLocaleString(),
          read: false,
        };
        this.notifications = [item, ...this.notifications].slice(0, 25);
        this.syncUnreadCount();
      });
  }

  private syncUnreadCount(): void {
    this.unreadNotifications = this.notifications.filter(n => !n.read).length;
    localStorage.setItem('customer_unread_notifications', String(this.unreadNotifications));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

