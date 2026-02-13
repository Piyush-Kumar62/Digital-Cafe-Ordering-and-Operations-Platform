// ...existing code...
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
    <div class="about-hero">
      <div class="about-hero-content">
        <div class="about-hero-icon">☕</div>
        <h1 class="about-title">About Digital Café Platform</h1>
        <p class="about-hero-tagline">
          Revolutionizing café management for the digital era-seamless, secure,
          and smart.
        </p>
      </div>
    </div>
    <div class="about-container">
      <div class="about-content">
        <div class="about-section mission-section">
          <h2><span class="section-icon">🚀</span> Our Mission</h2>
          <p>
            Digital Café Platform is designed to revolutionize the way cafés
            operate, providing a comprehensive solution for managing orders,
            operations, and customer experiences in the modern digital age.
          </p>
        </div>
        <div class="about-section features-section">
          <h2><span class="section-icon">✨</span> What We Offer</h2>
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
        <div class="about-section tech-section">
          <h2><span class="section-icon">🛠️</span> Our Technology</h2>
          <p>
            Built with cutting-edge technologies including
            <span class="highlight">Spring Boot</span> for the backend and
            <span class="highlight">Angular</span> for the frontend, ensuring a
            robust, scalable, and maintainable solution.
          </p>
          <div class="tech-stack">
            <span class="tech-badge"
              ><img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg"
                alt="Spring Boot"
              />Spring Boot</span
            >
            <span class="tech-badge"
              ><img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg"
                alt="Angular"
              />Angular</span
            >
            <span class="tech-badge"
              ><img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg"
                alt="MySQL"
              />MySQL</span
            >
            <span class="tech-badge"
              ><img
                src="https://img.icons8.com/ios-filled/50/228be6/websocket.png"
                alt="WebSocket"
                onerror="this.style.display='none'"
              />WebSocket</span
            >
            <span class="tech-badge"
              ><img
                src="https://img.icons8.com/ios-filled/50/228be6/jwt.png"
                alt="JWT"
                onerror="this.style.display='none'"
              />JWT</span
            >
            <span class="tech-badge"
              ><img
                src="https://img.icons8.com/ios-filled/50/228be6/api-settings.png"
                alt="REST API"
                onerror="this.style.display='none'"
              />REST API</span
            >
          </div>
        </div>
        <div class="about-section serve-section">
          <h2><span class="section-icon">🤝</span> Who We Serve</h2>
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
      .about-hero {
        background: linear-gradient(
          120deg,
          #18181b 0%,
          #1e293b 60%,
          #0f172a 100%
        );
        padding: 4rem 1rem 2rem 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 320px;
        position: relative;
        box-shadow: 0 8px 32px rgba(31, 41, 55, 0.12);
      }

      .about-hero-content {
        text-align: center;
        color: #fff;
        max-width: 700px;
        margin: 0 auto;
      }

      .about-hero-icon {
        font-size: 3.5rem;
        margin-bottom: 1.25rem;
        filter: drop-shadow(0 4px 16px #fbbf24cc);
      }

      .about-hero-tagline {
        font-size: 1.25rem;
        color: #fbbf24;
        margin-top: 1rem;
        margin-bottom: 0;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

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
        font-size: 2.5rem;
        color: #fbbf24;
        text-align: center;
        margin-bottom: 1.5rem;
        font-weight: 800;
        letter-spacing: -1px;
        font-family: "Poppins", sans-serif;
      }

      .about-section {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 18px;
        padding: 2.5rem;
        margin-bottom: 2.5rem;
        box-shadow:
          0 8px 32px rgba(220, 38, 38, 0.07),
          0 1.5px 8px rgba(31, 41, 55, 0.07);
        position: relative;
        overflow: hidden;
      }

      .about-section .section-icon {
        font-size: 1.5rem;
        margin-right: 0.5rem;
        vertical-align: middle;
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
        padding: 2rem 1.5rem;
        border-radius: 14px;
        border: 2px solid #fee2e2;
        background: rgba(255, 255, 255, 0.85);
        box-shadow: 0 4px 16px rgba(251, 191, 36, 0.07);
        transition:
          transform 0.3s,
          box-shadow 0.3s,
          border-color 0.3s;
        text-align: center;
      }

      .feature-card:hover {
        transform: translateY(-7px) scale(1.03);
        box-shadow: 0 12px 32px rgba(251, 191, 36, 0.13);
        border-color: #fbbf24;
      }

      .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        filter: drop-shadow(0 2px 8px #fbbf24cc);
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
        align-items: center;
      }

      .tech-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: #1e293b;
        padding: 0.5rem 1.5rem;
        border-radius: 25px;
        font-weight: 600;
        font-size: 0.95rem;
        box-shadow: 0 2px 8px rgba(251, 191, 36, 0.08);
        border: none;
        transition: background 0.3s;
      }

      .tech-badge img {
        width: 22px;
        height: 22px;
        vertical-align: middle;
        filter: drop-shadow(0 1px 2px #fbbf24cc);
      }

      .serve-list {
        list-style: none;
        padding: 0;
        margin-top: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1.25rem;
      }

      .serve-list li {
        padding: 1.25rem 1rem;
        margin-bottom: 0;
        background: #fef9c3;
        border-radius: 10px;
        border-left: 4px solid #fbbf24;
        font-size: 1.1rem;
        color: #4b5563;
        box-shadow: 0 2px 8px rgba(251, 191, 36, 0.07);
        font-weight: 500;
      }

      .serve-list strong {
        color: #b91c1c;
      }

      .cta-section {
        text-align: center;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: #1e293b;
        border-radius: 18px;
        box-shadow: 0 8px 32px rgba(251, 191, 36, 0.09);
      }

      .cta-section h2 {
        color: #b91c1c;
        font-size: 2rem;
        font-weight: 800;
      }

      .cta-section p {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 500;
      }

      .cta-button {
        display: inline-block;
        background: #b91c1c;
        color: #fff;
        padding: 1rem 3rem;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 700;
        font-size: 1.125rem;
        margin-top: 1.5rem;
        transition:
          transform 0.3s,
          box-shadow 0.3s,
          background 0.3s;
        box-shadow: 0 2px 8px rgba(185, 28, 28, 0.13);
      }

      .cta-button:hover {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 8px 24px rgba(185, 28, 28, 0.18);
        background: #dc2626;
      }

      @media (max-width: 900px) {
        .about-hero {
          padding: 2.5rem 0.5rem 1.5rem 0.5rem;
        }
        .about-title {
          font-size: 2rem;
        }
        .about-section {
          padding: 1.5rem;
        }
        .about-section h2 {
          font-size: 1.3rem;
        }
        .features-grid {
          grid-template-columns: 1fr 1fr;
        }
        .serve-list {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 600px) {
        .about-hero {
          padding: 1.5rem 0.25rem 1rem 0.25rem;
        }
        .about-title {
          font-size: 1.3rem;
        }
        .about-section {
          padding: 1rem;
        }
        .about-section h2 {
          font-size: 1.1rem;
        }
        .features-grid {
          grid-template-columns: 1fr;
        }
        .tech-badge {
          font-size: 0.85rem;
          padding: 0.4rem 1rem;
        }
      }
    `,
  ],
})
export class AboutComponent {}
