import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";

@Component({
  selector: "app-about",
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="about-container">
      <div class="about-content">
        <h1 class="about-title">About Digital Café Platform</h1>

        <div class="about-section">
          <h2>Our Mission</h2>
          <p>
            Digital Café Platform is designed to revolutionize the way cafés
            operate, providing a comprehensive solution for managing orders,
            operations, and customer experiences in the modern digital age.
          </p>
        </div>

        <div class="about-section">
          <h2>What We Offer</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🍽️</div>
              <h3>Order Management</h3>
              <p>
                Streamline your ordering process with our intuitive system that
                handles dine-in, takeaway, and delivery orders seamlessly.
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Real-time Analytics</h3>
              <p>
                Get insights into your business with comprehensive dashboards
                showing sales, popular items, and customer trends.
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">👥</div>
              <h3>Staff Management</h3>
              <p>
                Efficiently manage your team with role-based access control for
                admins, chefs, waiters, and cafe owners.
              </p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3>Secure & Reliable</h3>
              <p>
                Built with security-first approach using JWT authentication and
                role-based authorization.
              </p>
            </div>
          </div>
        </div>

        <div class="about-section">
          <h2>Our Technology</h2>
          <p>
            Built with cutting-edge technologies including Spring Boot for the
            backend and Angular for the frontend, ensuring a robust, scalable,
            and maintainable solution.
          </p>
          <div class="tech-stack">
            <span class="tech-badge">Spring Boot</span>
            <span class="tech-badge">Angular</span>
            <span class="tech-badge">MySQL</span>
            <span class="tech-badge">WebSocket</span>
            <span class="tech-badge">JWT</span>
            <span class="tech-badge">REST API</span>
          </div>
        </div>

        <div class="about-section">
          <h2>Who We Serve</h2>
          <ul class="serve-list">
            <li>
              <strong>Café Owners:</strong> Manage multiple cafés, staff, and
              operations from a single dashboard
            </li>
            <li>
              <strong>Café Managers:</strong> Oversee daily operations and
              monitor performance metrics
            </li>
            <li>
              <strong>Chefs:</strong> Receive and manage orders in real-time
              with kitchen display system
            </li>
            <li>
              <strong>Waiters:</strong> Take orders efficiently and track table
              status
            </li>
            <li>
              <strong>Customers:</strong> Browse menu, place orders, and track
              order status
            </li>
          </ul>
        </div>

        <div class="about-section cta-section">
          <h2>Ready to Transform Your Café?</h2>
          <p>
            Join us in revolutionizing café management with modern technology.
          </p>
          <a routerLink="/auth/register" class="cta-button"
            >Get Started Today</a
          >
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `
      .about-container {
        min-height: calc(100vh - 140px);
        background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
        padding: 3rem 1rem;
      }

      .about-content {
        max-width: 1200px;
        margin: 0 auto;
      }

      .about-title {
        font-size: 3rem;
        color: #dc2626;
        text-align: center;
        margin-bottom: 3rem;
        font-weight: 800;
      }

      .about-section {
        background: white;
        border-radius: 12px;
        padding: 2.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .about-section h2 {
        font-size: 2rem;
        color: #1f2937;
        margin-bottom: 1.5rem;
        font-weight: 700;
      }

      .about-section p {
        font-size: 1.125rem;
        line-height: 1.8;
        color: #4b5563;
        margin-bottom: 1rem;
      }

      .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-top: 2rem;
      }

      .feature-card {
        padding: 1.5rem;
        border-radius: 8px;
        border: 2px solid #fee2e2;
        transition:
          transform 0.3s,
          box-shadow 0.3s;
      }

      .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(220, 38, 38, 0.15);
        border-color: #dc2626;
      }

      .feature-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .feature-card h3 {
        font-size: 1.25rem;
        color: #1f2937;
        margin-bottom: 0.75rem;
        font-weight: 600;
      }

      .feature-card p {
        font-size: 1rem;
        color: #6b7280;
        margin: 0;
      }

      .tech-stack {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .tech-badge {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 25px;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .serve-list {
        list-style: none;
        padding: 0;
        margin-top: 1.5rem;
      }

      .serve-list li {
        padding: 1rem;
        margin-bottom: 0.75rem;
        background: #fef2f2;
        border-radius: 8px;
        border-left: 4px solid #dc2626;
        font-size: 1.125rem;
        color: #4b5563;
      }

      .serve-list strong {
        color: #dc2626;
      }

      .cta-section {
        text-align: center;
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
      }

      .cta-section h2 {
        color: white;
      }

      .cta-section p {
        color: #fef2f2;
        font-size: 1.25rem;
      }

      .cta-button {
        display: inline-block;
        background: white;
        color: #dc2626;
        padding: 1rem 3rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 700;
        font-size: 1.125rem;
        margin-top: 1.5rem;
        transition:
          transform 0.3s,
          box-shadow 0.3s;
      }

      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      }

      @media (max-width: 768px) {
        .about-title {
          font-size: 2rem;
        }

        .about-section {
          padding: 1.5rem;
        }

        .about-section h2 {
          font-size: 1.5rem;
        }

        .features-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AboutComponent {}
