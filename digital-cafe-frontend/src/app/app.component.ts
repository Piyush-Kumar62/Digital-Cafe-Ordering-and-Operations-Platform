import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { WebSocketService } from './core/websocket/websocket.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent, ToastComponent],
  template: `
    <div style="min-height: 100vh;">
      <router-outlet></router-outlet>
      <app-loading></app-loading>
      <app-toast></app-toast>
    </div>
  `,
  styles: [],
})
export class AppComponent implements OnInit {
  title = 'Digital Café Platform';

  constructor(
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    try {
      // If we're on the landing page and have a stored user but no valid token,
      // silently clear the auth state without redirecting
      const currentUrl = this.router.url;
      if (
        (currentUrl === '/' || currentUrl === '') &&
        this.authService.currentUserValue &&
        !this.authService.getToken()
      ) {
        this.authService.logout();
      }

      // Connect to WebSocket only if user is authenticated (non-blocking)
      setTimeout(() => {
        if (this.authService.isAuthenticated) {
          try {
            this.webSocketService.connect();
          } catch (error) {
            console.warn('WebSocket connection failed:', error);
          }
        }
      }, 1000);

      // Subscribe to auth changes
      this.authService.currentUser.subscribe((user) => {
        try {
          if (user) {
            // Connect WebSocket when user logs in
            if (!this.webSocketService.isConnected()) {
              this.webSocketService.connect();
            }
          } else {
            // Disconnect WebSocket when user logs out
            if (this.webSocketService.isConnected()) {
              this.webSocketService.disconnect();
            }
          }
        } catch (error) {
          console.warn('WebSocket operation failed:', error);
        }
      });
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }
}
