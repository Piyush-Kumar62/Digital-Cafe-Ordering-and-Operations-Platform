import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-cafe-management",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="management-container">
      <div class="page-header">
        <h1 class="page-title">Café Management</h1>
        <p class="page-subtitle">Manage all registered cafés</p>
      </div>

      <div class="content-card">
        <h2>Coming Soon</h2>
        <p>Café management interface will be available here.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .management-container {
        padding: 0;
      }

      .page-header {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .page-title {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.5rem 0;
      }

      .page-subtitle {
        color: #6b7280;
        margin: 0;
      }

      .content-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
    `,
  ],
})
export class CafeManagementComponent {}
