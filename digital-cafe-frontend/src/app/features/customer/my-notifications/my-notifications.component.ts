import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";
import { uppercaseMeridiem } from "@core/utils/date-time-format.util";
import { WebSocketService } from "@core/websocket/websocket.service";
import { Subject, takeUntil } from "rxjs";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

interface RealtimePayload {
  title?: string;
  type?: string;
  message?: string;
  description?: string;
  timestamp?: string;
}

@Component({
  selector: "app-my-notifications",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./my-notifications.component.html",
  styleUrls: ["./my-notifications.component.scss"],
})
export class MyNotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  private destroy$ = new Subject<void>();
  private destinations = new Set<string>();
  private readonly webSocketService = inject(WebSocketService);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (!user) {
      return;
    }

    this.bindDestination("/user/queue/notifications");
    this.bindDestination(`/user/${user.id}/queue/notifications`);
    this.bindDestination(`/topic/customer/${user.id}`);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destinations.forEach((destination) =>
      this.webSocketService.unsubscribe(destination),
    );
  }

  private bindDestination(destination: string): void {
    this.destinations.add(destination);
    this.webSocketService
      .watchDestination<RealtimePayload>(destination)
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        const item: NotificationItem = {
          id: `${Date.now()}-${Math.random()}`,
          title: payload?.title || payload?.type || "Notification",
          message: payload?.message || JSON.stringify(payload),
          createdAt: payload?.timestamp
            ? uppercaseMeridiem(new Date(payload.timestamp).toLocaleString())
            : uppercaseMeridiem(new Date().toLocaleString()),
        };
        this.notifications = [item, ...this.notifications].slice(0, 100);
      });
  }
}
