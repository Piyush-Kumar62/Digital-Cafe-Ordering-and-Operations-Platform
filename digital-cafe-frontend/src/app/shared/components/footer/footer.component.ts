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
            <h3 class="brand-name">Digital Café</h3>
            <p class="brand-tagline">
              Transform the way you experience café dining with seamless
              booking, ordering, and operations management.
            </p>
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
            <a routerLink="/about">About Us</a>
            <a routerLink="/contact">Contact</a>
          </div>

          <div class="link-group">
            <h4>User Roles</h4>
            <a routerLink="/auth/register">Customer</a>
            <a routerLink="/auth/register">Café Owner</a>
            <a routerLink="/auth/register">Chef</a>
            <a routerLink="/auth/register">Waiter</a>
            <a routerLink="/auth/login">Admin</a>
          </div>

          <div class="link-group">
            <h4>Contact & Legal</h4>
            <a href="mailto:piyushkumar30066@gmail.com"
              >📧 piyushkumar30066@gmail.com</a
            >
            <a href="tel:+916202079747">📞 +91 6202079747</a>
            <a href="#">📍 Bihar, India</a>
            <div class="legal-links">
              <a routerLink="/privacy">Privacy Policy</a>
              <a routerLink="/terms">Terms & Conditions</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>
            &copy; {{ currentYear }} Digital Café Platform. All rights reserved.
          </p>
          <p class="powered-by">Built with ❤️ for the café community</p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        background-color: #0f172a;
        color: #94a3b8;
        padding: 4rem 0 1.5rem;
        margin-top: auto;
        border-top: 1px solid #1e293b;
      }

      .footer-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 2rem;
      }

      .footer-content {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1.5fr;
        gap: 3rem;
        margin-bottom: 3rem;
      }

      .footer-brand {
        .brand-name {
          color: #ffffff;
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
          font-family: "Poppins", sans-serif;
          background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-tagline {
          color: #cbd5e1;
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
      }

      .social-icons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.5rem;
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

      .link-group {
        h4 {
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          letter-spacing: 0.5px;
        }

        a {
          display: block;
          color: #94a3b8;
          text-decoration: none;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          padding-left: 0;

          &:hover {
            color: #fbbf24;
            padding-left: 5px;
          }
        }
      }

      .legal-links {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #1e293b;
      }

      .footer-bottom {
        padding-top: 2rem;
        border-top: 1px solid #1e293b;
        text-align: center;

        p {
          margin: 0.25rem 0;
          font-size: 0.875rem;
          color: #64748b;

          &.powered-by {
            font-size: 0.8rem;
            margin-top: 0.5rem;
          }
        }
      }

      @media (max-width: 1024px) {
        .footer-content {
          grid-template-columns: repeat(2, 1fr);
          gap: 2.5rem;
        }

        .footer-brand {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 640px) {
        .footer {
          padding: 3rem 0 1.5rem;
        }

        .footer-content {
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        .footer-brand {
          grid-column: 1;
          text-align: center;
        }

        .social-icons {
          justify-content: center;
        }

        .link-group {
          text-align: center;

          a:hover {
            padding-left: 0;
          }
        }
      }
    `,
  ],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
