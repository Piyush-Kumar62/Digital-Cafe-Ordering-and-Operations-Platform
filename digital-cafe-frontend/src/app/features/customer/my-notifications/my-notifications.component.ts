import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { WebSocketService } from "@core/websocket/websocket.service";
import { Subject, takeUntil } from "rxjs";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

@Component({
  selector: "app-my-notifications",
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-notifications.component.html',
  styleUrls: ['./my-notifications.component.scss'],
})
export class MyNotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.webSocketService.watchDestination<any>("/user/queue/notifications")
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        const item: NotificationItem = {
          id: `${Date.now()}-${Math.random()}`,
          title: payload?.title || payload?.type || "Notification",
          message: payload?.message || JSON.stringify(payload),
          createdAt: new Date().toLocaleString(),
        };
        this.notifications = [item, ...this.notifications].slice(0, 100);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
