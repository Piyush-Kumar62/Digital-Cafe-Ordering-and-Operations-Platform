import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";

@Component({
  selector: "app-privacy-policy",
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="legal-page">
      <section class="legal-card">
        <h1>Privacy Policy</h1>
        <p>
          Digital Café protects user information through secure access controls,
          encrypted communication, and role-based authorization.
        </p>
        <h2>What We Store</h2>
        <ul>
          <li>Account and profile information required for platform operation</li>
          <li>Booking, order, and payment transaction references</li>
          <li>Operational logs for security and audit visibility</li>
        </ul>
        <h2>How We Use Data</h2>
        <ul>
          <li>To provide booking, ordering, and role-based workflow features</li>
          <li>To enforce security rules (verification and profile checks)</li>
          <li>To improve reliability, reporting, and customer experience</li>
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
export class PrivacyPolicyComponent {}

