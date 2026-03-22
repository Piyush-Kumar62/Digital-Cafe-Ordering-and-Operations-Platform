import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { WebSocketService } from './core/websocket/websocket.service';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Digital Café Platform';

  constructor(
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    try {
      this.initializeTheme();
      this.preloadCriticalImages();

      // Clear stale auth state on landing page when the JWT token is gone
      const currentUrl = this.router.url;
      if (
        (currentUrl === '/' || currentUrl === '') &&
        this.authService.currentUserValue &&
        !this.authService.getToken()
      ) {
        this.authService.logout();
      }

      // Defer WebSocket connection to avoid blocking the initial render
      setTimeout(() => {
        if (this.authService.isAuthenticated) {
          try {
            this.webSocketService.connect();
          } catch {
            // Non-critical — app remains functional without WebSocket
          }
        }
      }, 1000);

      // Subscribe to auth changes
      this.authService.currentUser.subscribe((user) => {
        try {
          if (user) {
            if (!this.webSocketService.isConnected()) {
              this.webSocketService.connect();
            }
          } else {
            if (this.webSocketService.isConnected()) {
              this.webSocketService.disconnect();
            }
          }
        } catch {
          // Non-critical — app remains functional without WebSocket
        }
      });
    } catch {
      // Swallow top-level init errors to prevent white-screen on degraded environments
    }
  }

  private initializeTheme(): void {
    this.themeService.initTheme();
  }

  private preloadCriticalImages(): void {
    const urls = [
      "/assets/coffee/coffee-scene-nathan-03.jpg",
      "/assets/coffee/coffee-table-pexels.jpg",
      "/assets/cafe/cafe-ambience.jpg",
    ];

    urls.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.setAttribute("fetchpriority", "high");
      img.src = src;
    });
  }
}
