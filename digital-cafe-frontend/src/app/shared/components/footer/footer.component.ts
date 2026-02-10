import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-brand">
            <h3 class="brand-name">Digital Café</h3>
            <p class="brand-tagline">Modern café ordering & operations platform</p>
          </div>

          <div class="footer-links">
            <div class="link-group">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#about">About</a>
            </div>

            <div class="link-group">
              <h4>Support</h4>
              <a href="#help">Help Center</a>
              <a href="#contact">Contact</a>
              <a href="#faq">FAQ</a>
            </div>

            <div class="link-group">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} Digital Café Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .footer {
        background-color: #1f2937;
        color: #9ca3af;
        padding: 3rem 0 1rem;
        margin-top: auto;
      }

      .footer-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 2rem;
      }

      .footer-content {
        display: grid;
        grid-template-columns: 2fr 3fr;
        gap: 3rem;
        margin-bottom: 2rem;
      }

      .footer-brand {
        .brand-name {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          font-family: 'Poppins', sans-serif;
        }

        .brand-tagline {
          color: #9ca3af;
          font-size: 0.875rem;
        }
      }

      .footer-links {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;
      }

      .link-group {
        h4 {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        a {
          display: block;
          color: #9ca3af;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: color 0.3s;

          &:hover {
            color: #ffffff;
          }
        }
      }

      .footer-bottom {
        padding-top: 2rem;
        border-top: 1px solid #374151;
        text-align: center;

        p {
          margin: 0;
          font-size: 0.875rem;
        }
      }

      @media (max-width: 768px) {
        .footer-content {
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        .footer-links {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
      }
    `,
  ],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
