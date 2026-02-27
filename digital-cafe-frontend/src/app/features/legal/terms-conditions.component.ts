import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";

@Component({
  selector: "app-terms-conditions",
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="legal-page">
      <section class="legal-card">
        <h1>Terms & Conditions</h1>
        <p>
          By using Digital Café, users agree to platform rules for role-based
          access, secure authentication, and operational workflows.
        </p>
        <h2>Account & Access</h2>
        <ul>
          <li>Customer self-registration is allowed through public form</li>
          <li>Owner/Chef/Waiter accounts are provisioned via managed flow</li>
          <li>Email verification and required profile completion are mandatory</li>
        </ul>
        <h2>Operational Usage</h2>
        <ul>
          <li>Bookings, orders, and status updates must follow workflow policy</li>
          <li>Unauthorized role actions are blocked by access controls</li>
          <li>Payment and order records are retained for audit needs</li>
        </ul>
      </section>
    </main>
    <app-footer></app-footer>
  `,
  styles: [
    `
      .legal-page {
        min-height: calc(100vh - 140px);
        padding: 2rem 1rem;
        background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
      }
      .legal-card {
        max-width: 900px;
        margin: 0 auto;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 16px;
        padding: 1.5rem;
        color: #e2e8f0;
      }
      h1 {
        margin: 0 0 1rem 0;
        color: #f8fafc;
      }
      h2 {
        margin: 1.1rem 0 0.55rem 0;
        color: #93c5fd;
      }
      p, li {
        color: #cbd5e1;
        line-height: 1.65;
      }
    `,
  ],
})
export class TermsConditionsComponent {}

