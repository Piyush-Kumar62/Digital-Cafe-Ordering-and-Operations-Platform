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
  template: `
    <section class="page">
      <header>
        <h1>Notifications</h1>
        <p>Real-time updates for bookings and orders.</p>
      </header>

      <div class="stack" *ngIf="notifications.length; else empty">
        <article class="card" *ngFor="let n of notifications">
          <h3>{{ n.title }}</h3>
          <p>{{ n.message }}</p>
          <small>{{ n.createdAt }}</small>
        </article>
      </div>

      <ng-template #empty>
        <div class="card">No notifications yet.</div>
      </ng-template>
    </section>
  `,
  styles: [`
    .page { padding: 1rem; }
    header h1 { margin: 0; }
    header p { color: #64748b; margin: .4rem 0 1rem; }
    .stack { display: grid; gap: .7rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: .9rem; }
    h3 { margin: 0 0 .35rem; }
    p { margin: 0 0 .35rem; color: #334155; }
    small { color: #64748b; }
  `],
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
