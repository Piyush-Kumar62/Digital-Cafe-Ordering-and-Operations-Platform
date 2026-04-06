import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";
import { WebSocketService } from "@core/websocket/websocket.service";
import { uppercaseMeridiem } from "@core/utils/date-time-format.util";
import { Subject, takeUntil } from "rxjs";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface RealtimePayload {
  title?: string;
  type?: string;
  message?: string;
  description?: string;
  timestamp?: string;
}

@Component({
  selector: "app-notification-center",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./notification-center.component.html",
  styleUrls: ["./notification-center.component.scss"],
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  readonly pageSize = 10;
  currentPage = 1;
  private readonly destroy$ = new Subject<void>();
  private readonly destinations = new Set<string>();
  private readonly authService = inject(AuthService);
  private readonly webSocketService = inject(WebSocketService);

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (!user) {
      return;
    }

    this.bindDestination("/user/queue/notifications");
    this.bindDestination(`/user/${user.id}/queue/notifications`);

    const roles = user.roles || [];
    if (roles.includes("ROLE_CUSTOMER")) {
      this.bindDestination(`/topic/customer/${user.id}`);
    }

    if (roles.includes("ROLE_ADMIN")) {
      this.bindDestination("/topic/admin/orders");
    }

    if (
      (roles.includes("ROLE_CAFE_OWNER") ||
        roles.includes("ROLE_CHEF") ||
        roles.includes("ROLE_WAITER")) &&
      user.cafeId
    ) {
      if (roles.includes("ROLE_CAFE_OWNER")) {
        this.bindDestination(`/topic/cafe/${user.cafeId}`);
        this.bindDestination(`/topic/cafe/${user.cafeId}/tables`);
      }
      if (roles.includes("ROLE_CHEF")) {
        this.bindDestination(`/topic/chef/${user.cafeId}`);
      }
      if (roles.includes("ROLE_WAITER")) {
        this.bindDestination(`/topic/waiter/${user.cafeId}`);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destinations.forEach((destination) =>
      this.webSocketService.unsubscribe(destination),
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.notifications.length / this.pageSize));
  }

  get pagedNotifications(): NotificationItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.notifications.slice(start, start + this.pageSize);
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  private bindDestination(destination: string): void {
    this.destinations.add(destination);
    this.webSocketService
      .watchDestination<RealtimePayload>(destination)
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => this.pushNotification(payload));
  }

  private pushNotification(payload: RealtimePayload): void {
    const title = payload?.title || payload?.type || "Notification";
    const message =
      payload?.message || payload?.description || "You have a new update.";
    const createdAt = payload?.timestamp
      ? uppercaseMeridiem(new Date(payload.timestamp).toLocaleString())
      : uppercaseMeridiem(new Date().toLocaleString());

    const fingerprint = `${title}|${message}|${createdAt}`;
    const duplicate = this.notifications.some(
      (n) => `${n.title}|${n.message}|${n.createdAt}` === fingerprint,
    );
    if (duplicate) {
      return;
    }

    this.notifications = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        message,
        createdAt,
        read: false,
      },
      ...this.notifications,
    ].slice(0, 200);
    this.currentPage = 1;
  }
}
