import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="brand-header">
              <span class="footer-logo-wrap">
                <img
                  src="assets/digital-cafe-logo.png"
                  alt="Digital Café Logo"
                  class="footer-logo"
                />
              </span>
              <h3 class="brand-name">Digital Café</h3>
            </div>
            <p class="brand-tagline">
              Transform the way you experience café dining with seamless
              booking, ordering, and operations management.
            </p>
            <div class="brand-quick-actions" aria-label="Brand quick actions">
              <a class="brand-action action-owner" routerLink="/contact">Request Owner Account</a>
              <a class="brand-action action-support" routerLink="/contact">Contact Support</a>
            </div>
            <div class="social-icons">
              <a
                href="https://www.linkedin.com/in/piyush-kumar62"
                target="_blank"
                rel="noopener noreferrer"
                class="social-link linkedin"
                aria-label="LinkedIn"
              >
                <span class="icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      fill="currentColor"
                      d="M20.447 20.452h-3.554V14.83c0-1.343-.027-3.073-1.877-3.073-1.878 0-2.166 1.464-2.166 2.978v5.717H9.296V9h3.414v1.561h.047c.476-.9 1.637-1.85 3.37-1.85 3.604 0 4.271 2.372 4.271 5.456v6.285zM5.337 7.433a2.062 2.062 0 110-4.123 2.062 2.062 0 010 4.123zM6.915 20.452H3.66V9h3.255v11.452z"
                    />
                  </svg>
                </span>
                <span class="social-label">LinkedIn</span>
              </a>
              <a
                href="https://github.com/Piyush-Kumar62"
                target="_blank"
                rel="noopener noreferrer"
                class="social-link github"
                aria-label="GitHub"
              >
                <span class="icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      fill="currentColor"
                      d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.799 8.207 11.387.6.111.82-.261.82-.58 0-.285-.011-1.041-.017-2.044-3.338.726-4.042-1.61-4.042-1.61-.546-1.389-1.333-1.759-1.333-1.759-1.09-.745.083-.73.083-.73 1.205.085 1.839 1.237 1.839 1.237 1.07 1.834 2.809 1.304 3.492.997.108-.775.419-1.305.762-1.605-2.665-.304-5.467-1.332-5.467-5.931 0-1.31.469-2.382 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.47 11.47 0 013.004-.404 11.46 11.46 0 013.004.404c2.292-1.552 3.298-1.23 3.298-1.23.655 1.652.243 2.873.119 3.176.77.839 1.235 1.911 1.235 3.221 0 4.61-2.807 5.625-5.48 5.921.43.372.823 1.102.823 2.222 0 1.604-.015 2.896-.015 3.289 0 .321.218.695.825.577C20.565 21.795 24 17.29 24 12c0-6.63-5.373-12-12-12z"
                    />
                  </svg>
                </span>
                <span class="social-label">GitHub</span>
              </a>
              <a
                href="https://x.com/PIYUSH_KUMAR6"
                target="_blank"
                rel="noopener noreferrer"
                class="social-link x"
                aria-label="X"
              >
                <span class="icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      fill="currentColor"
                      d="M18.244 2H21.5l-7.378 8.42L22 22h-6.18l-4.824-5.78L4.8 22H1.5l7.85-8.95L2 2h6.32l4.357 5.228z"
                    />
                  </svg>
                </span>
                <span class="social-label">X</span>
              </a>
            </div>
          </div>

          <div class="link-group">
            <h4>Quick Links</h4>
            <a routerLink="/" fragment="features">Features</a>
            <a routerLink="/" fragment="how-it-works">How It Works</a>
            <a routerLink="/" fragment="role-matrix">Role Matrix</a>
            <a routerLink="/" fragment="faq">FAQ</a>
            <a routerLink="/about">About Us</a>
            <a routerLink="/contact">Contact</a>
          </div>

          <div class="link-group">
            <h4>User Roles</h4>
            <a routerLink="/auth/register">Customer</a>
            <a routerLink="/contact" fragment="owner-onboarding">Café Owner</a>
            <a routerLink="/contact" fragment="chef-onboarding">Chef</a>
            <a routerLink="/contact" fragment="waiter-onboarding">Waiter</a>
            <a routerLink="/auth/login">Admin</a>
          </div>

          <div class="link-group">
            <h4>Support & Legal</h4>
            <a routerLink="/" fragment="faq">Help Center</a>
            <a href="mailto:piyushkumar30066@gmail.com?subject=Digital%20Cafe%20Support%20Request&body=Please%20describe%20your%20issue%20with%20steps%20to%20reproduce.">Report Issue</a>
            <a routerLink="/" fragment="workflow">System Status</a>
            <a href="mailto:piyushkumar30066@gmail.com"
              >📧 piyushkumar30066@gmail.com</a
            >
            <a href="tel:+916202079747">📞 +91 6202079747</a>
            <a href="https://maps.google.com/?q=Bihar%2C%20India" target="_blank" rel="noopener noreferrer">📍 Bihar, India</a>
            <div class="legal-links">
              <a routerLink="/privacy">Privacy Policy</a>
              <a routerLink="/terms">Terms & Conditions</a>
              <a routerLink="/contact" fragment="cookie-policy">Cookie Preferences</a>
              <a routerLink="/contact" fragment="refund-policy">Refund & Cancellation</a>
              <a routerLink="/contact" fragment="data-deletion">Data Deletion Request</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-inline">
            <span class="meta-pill">&copy; {{ currentYear }} Digital Café Platform</span>
            <span class="divider" aria-hidden="true">•</span>
            <span class="rights-text">All rights reserved</span>
            <span class="divider" aria-hidden="true">•</span>
            <span class="powered-by">Built with <span class="heart" aria-hidden="true">❤️</span> for the café community</span>
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        background-color: #0f172a;
        color: #94a3b8;
        padding: 2.8rem 0 1.2rem;
        margin-top: auto;
        border-top: 1px solid #1e293b;
        --footer-card-border: rgba(148, 163, 184, 0.36);
      }

      .footer-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 2rem;
      }

      .footer-content {
        display: grid;
        grid-template-columns: 1.7fr 1fr 1fr 1.35fr;
        align-items: stretch;
        gap: 2rem;
        margin-bottom: 0.5rem;
      }

      .footer-brand,
      .link-group {
        border: 1px solid var(--footer-card-border);
        background: linear-gradient(
          160deg,
          rgba(15, 23, 42, 0.95),
          rgba(30, 41, 59, 0.78)
        );
        border-radius: 16px;
        padding: 1rem 1rem 0.95rem;
        box-shadow:
          0 14px 30px rgba(2, 6, 23, 0.28),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
        height: 100%;
        position: relative;
        overflow: hidden;
        isolation: isolate;
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }

      .footer-brand::before,
      .link-group::before {
        content: none;
      }

      .footer-brand:hover::before,
      .link-group:hover::before {
        content: none;
      }

      .footer-brand:hover,
      .link-group:hover {
        transform: translateY(-2px);
        box-shadow:
          0 20px 38px rgba(2, 6, 23, 0.34),
          0 0 20px rgba(99, 102, 241, 0.22),
          inset 0 1px 0 rgba(255, 255, 255, 0.09);
      }

      .footer-brand > *,
      .link-group > * {
        position: relative;
        z-index: 1;
      }

      .footer-brand {
        display: flex;
        flex-direction: column;
      }

      .brand-header {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin-bottom: 0.6rem;
      }

      .footer-logo-wrap {
        width: 44px;
        height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        background: linear-gradient(160deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.75));
        box-shadow:
          0 8px 18px rgba(2, 6, 23, 0.32),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .footer-logo {
        height: 30px;
        width: auto;
        max-width: 32px;
        min-width: 30px;
        object-fit: contain;
        display: block;
      }

      .footer-brand .brand-name {
        color: #ffffff;
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0;
        font-family: "Poppins", sans-serif;
        background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .footer-brand .brand-tagline {
        color: #cbd5e1;
        font-size: 0.9rem;
        line-height: 1.6;
        margin-bottom: 1rem;
      }

      .trust-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .trust-badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.25rem 0.6rem;
        border: 1px solid rgba(148, 163, 184, 0.32);
        background: rgba(30, 41, 59, 0.55);
        color: #dbeafe;
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .brand-quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-bottom: 0.95rem;
      }

      .brand-action {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.28rem 0.62rem;
        font-size: 0.74rem;
        font-weight: 700;
        text-decoration: none;
        border: 1px solid rgba(148, 163, 184, 0.34);
        color: #e2e8f0;
        background: rgba(15, 23, 42, 0.62);
        transition: all 0.2s ease;
      }

      .brand-action:hover {
        transform: translateY(-1px);
      }

      .brand-action.action-customer {
        border-color: rgba(96, 165, 250, 0.5);
        color: #dbeafe;
      }

      .brand-action.action-owner {
        border-color: rgba(192, 132, 252, 0.55);
        color: #f3e8ff;
      }

      .brand-action.action-support {
        border-color: rgba(110, 231, 183, 0.55);
        color: #d1fae5;
      }

      .social-icons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: auto;
        padding-top: 1rem;
      }

      .social-link {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background-color: rgba(15, 23, 42, 0.7);
        text-decoration: none;
        color: #e2e8f0;
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0.3px;
        transition: all 0.25s ease;
        --brand-color: #fbbf24;
      }

      .social-link .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        color: var(--brand-color);
      }

      .social-link svg {
        width: 20px;
        height: 20px;
      }

      .social-link .social-label {
        white-space: nowrap;
      }

      .social-link.linkedin {
        --brand-color: #0a66c2;
      }

      .social-link.github {
        --brand-color: #f5f5f5;
      }

      .social-link.x {
        --brand-color: #ffffff;
      }

      .social-link:hover {
        transform: translateY(-2px);
        border-color: var(--brand-color);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      }

      .link-group h4 {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }

      .link-group {
        display: flex;
        flex-direction: column;
      }

      .link-group a {
        display: block;
        width: fit-content;
        color: #94a3b8;
        text-decoration: none;
        margin-bottom: 0.35rem;
        font-size: 0.95rem;
        line-height: 1.35;
      }

      .link-group a:hover {
        color: #fbbf24;
        padding-left: 5px;
      }

      .legal-links {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #1e293b;
      }

      .footer-helper-card {
        margin-top: auto;
        padding: 0.7rem 0.75rem;
        border-radius: 12px;
        border: 1px solid var(--footer-card-border);
        background: rgba(15, 23, 42, 0.65);
        position: relative;
        overflow: hidden;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .footer-helper-card::before {
        content: none;
      }

      .footer-helper-card > * {
        position: relative;
        z-index: 1;
      }

      .footer-helper-card:hover {
        transform: translateY(-1px);
        box-shadow:
          0 10px 20px rgba(2, 6, 23, 0.3),
          0 0 14px rgba(59, 130, 246, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .footer-helper-card h5 {
        margin: 0 0 0.35rem 0;
        color: #f8fafc;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .footer-helper-card p {
        margin: 0;
        color: #cbd5e1;
        font-size: 0.76rem;
        line-height: 1.45;
      }

      .footer-helper-card .helper-link {
        margin-top: 0.5rem;
        margin-bottom: 0;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.26rem 0.56rem;
        font-size: 0.72rem;
        font-weight: 700;
        color: #dbeafe;
        border: 1px solid rgba(147, 197, 253, 0.35);
        background: rgba(37, 99, 235, 0.18);
      }

      .footer-bottom {
        padding-top: 1rem;
        border-top: 1px solid #1e293b;
        text-align: center;
        margin-top: 0.2rem;
      }
      .footer-bottom p {
        margin: 0;
      }

      .footer a:focus-visible {
        outline: 2px solid #93c5fd;
        outline-offset: 2px;
        border-radius: 8px;
      }

      .footer-inline {
        margin: 0 auto;
        font-size: 0.88rem;
        color: #d5deeb;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: nowrap;
        white-space: nowrap;
        width: fit-content;
        max-width: 100%;
        overflow-x: auto;
        padding: 0.1rem 0.25rem;
      }

      .footer-inline .divider {
        color: #94a3b8;
        font-weight: 700;
      }

      .meta-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.22rem 0.58rem;
        border: 1px solid rgba(148, 163, 184, 0.34);
        background: rgba(30, 41, 59, 0.48);
        color: #e2e8f0;
        font-weight: 700;
      }

      .rights-text {
        color: #dbeafe;
        font-weight: 600;
      }

      .powered-by {
        margin: 0;
        color: #c7d2e4;
        font-size: 0.84rem;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .heart {
        filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.42));
      }

      @media (max-width: 1024px) {
        .footer-content {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.5rem;
        }

        .footer-brand {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 640px) {
        .footer {
          padding: 2.2rem 0 1.1rem;
        }

        .footer-content {
          grid-template-columns: 1fr;
          gap: 1.2rem;
          margin-bottom: 0.45rem;
        }

        .footer-brand {
          grid-column: 1;
          text-align: center;
        }

        .brand-header {
          justify-content: center;
        }

        .footer-brand,
        .link-group {
          padding: 0.9rem 0.85rem;
        }

        .social-icons {
          justify-content: center;
        }

        .trust-badges {
          justify-content: center;
        }

        .brand-quick-actions {
          justify-content: center;
        }

        .link-group {
          text-align: center;

          a:hover {
            padding-left: 0;
          }
        }

        .footer-helper-card {
          text-align: left;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
        }

        .footer-inline {
          font-size: 0.8rem;
          gap: 0.35rem;
        }
      }
    `,
  ],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
