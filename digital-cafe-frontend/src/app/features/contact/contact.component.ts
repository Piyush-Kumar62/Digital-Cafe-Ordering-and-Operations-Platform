import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";
import { NotificationService } from "@core/services/notification.service";

@Component({
  selector: "app-contact",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="contact-container">
      <div class="contact-content">
        <div class="contact-hero">
          <span class="hero-chip">Support Team Online</span>
          <h1 class="contact-title">Contact Us</h1>
          <p class="contact-subtitle">
            Have questions? We'd love to hear from you. Send us a message and
            we'll respond as soon as possible.
          </p>
          <div class="hero-points">
            <span>Fast Response</span>
            <span>Role Onboarding Help</span>
            <span>Account & Access Support</span>
          </div>
        </div>

        <div class="content-wrapper">
          <div class="contact-info">
            <h2>Get In Touch</h2>

            <div class="info-card">
              <div class="info-icon">📍</div>
              <div class="info-details">
                <h3>Address</h3>
                <p>
                  123 Digital Street<br />Café District, Tech City<br />India -
                  110001
                </p>
              </div>
            </div>

            <div class="info-card">
              <div class="info-icon">📧</div>
              <div class="info-details">
                <h3>Email</h3>
                <p>support@digitalcafe.com<br />info@digitalcafe.com</p>
              </div>
            </div>

            <div class="info-card">
              <div class="info-icon">📞</div>
              <div class="info-details">
                <h3>Phone</h3>
                <p>+91 123 456 7890<br />+91 987 654 3210</p>
              </div>
            </div>

            <div class="info-card">
              <div class="info-icon">⏰</div>
              <div class="info-details">
                <h3>Business Hours</h3>
                <p>
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday: 10:00 AM - 4:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </div>

            <div class="social-links">
              <h3>Follow Us</h3>
              <div class="social-icons">
                <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" class="social-icon">💼</a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" class="social-icon">🐦</a>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" class="social-icon">📸</a>
                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" class="social-icon">📘</a>
              </div>
            </div>
          </div>

          <div class="contact-form-section">
            <h2>Send us a Message</h2>
            <p class="form-caption">Share your query and our team will connect with you shortly.</p>
            <form
              class="contact-form"
              (ngSubmit)="submitForm()"
              #contactForm="ngForm"
            >
              <div class="form-group">
                <label for="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  [(ngModel)]="formData.name"
                  required
                  placeholder="Enter your full name"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  [(ngModel)]="formData.email"
                  required
                  email
                  placeholder="your.email@example.com"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  [(ngModel)]="formData.phone"
                  placeholder="+91 1234567890"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  [(ngModel)]="formData.subject"
                  required
                  placeholder="What is this regarding?"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  [(ngModel)]="formData.message"
                  required
                  rows="6"
                  placeholder="Tell us more about your inquiry..."
                  class="form-input"
                ></textarea>
              </div>

              <button
                type="submit"
                class="submit-button"
                [disabled]="!contactForm.valid || isSubmitting"
              >
                {{ isSubmitting ? "Sending..." : "Send Message" }}
              </button>
            </form>
          </div>
        </div>

        <div class="map-section">
          <h2>Find Us</h2>
          <div class="map-placeholder">
            <p>📍 Map Location</p>
            <p class="map-text">123 Digital Street, Café District, Tech City</p>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `
      .contact-container {
        min-height: calc(100vh - 140px);
        background:
          radial-gradient(circle at 10% 10%, rgba(251, 191, 36, 0.14), transparent 32%),
          radial-gradient(circle at 90% 15%, rgba(59, 130, 246, 0.14), transparent 34%),
          linear-gradient(135deg, #fef2f2 0%, #fff 100%);
        padding: 3rem 1rem;
      }

      .contact-content {
        max-width: 1200px;
        margin: 0 auto;
      }

      @keyframes riseIn {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .contact-hero {
        text-align: center;
        margin-bottom: 2.5rem;
      }

      .hero-chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.38rem 0.8rem;
        background: rgba(220, 38, 38, 0.12);
        border: 1px solid rgba(220, 38, 38, 0.28);
        color: #b91c1c;
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }

      .contact-title {
        font-size: 3rem;
        color: #dc2626;
        text-align: center;
        margin: 0.75rem 0 0.8rem;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .contact-subtitle {
        text-align: center;
        font-size: 1.25rem;
        color: #4b5563;
        margin-bottom: 1rem;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
      }

      .hero-points {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;

        span {
          border-radius: 999px;
          padding: 0.3rem 0.7rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #0f172a;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.34);
        }
      }

      .content-wrapper {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 2rem;
        margin-bottom: 3rem;
      }

      .contact-info,
      .contact-form-section {
        background: linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
        border-radius: 18px;
        padding: 2.5rem;
        border: 1px solid rgba(148, 163, 184, 0.26);
        box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
        animation: riseIn 0.55s ease both;
      }

      .contact-form-section {
        animation-delay: 0.08s;
      }

      .contact-info h2,
      .contact-form-section h2 {
        font-size: 1.75rem;
        color: #1f2937;
        margin-bottom: 1.5rem;
        font-weight: 700;
      }

      .info-card {
        display: flex;
        align-items: flex-start;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        background: linear-gradient(140deg, #fff7ed, #fef2f2);
        border-radius: 12px;
        border: 1px solid rgba(248, 113, 113, 0.2);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }

      .info-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 14px 26px rgba(239, 68, 68, 0.12);
      }

      .info-icon {
        font-size: 2rem;
        margin-right: 1rem;
      }

      .info-details h3 {
        font-size: 1.125rem;
        color: #dc2626;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }

      .info-details p {
        color: #4b5563;
        line-height: 1.6;
        margin: 0;
      }

      .social-links {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 2px solid #fee2e2;
      }

      .social-links h3 {
        font-size: 1.125rem;
        color: #1f2937;
        margin-bottom: 1rem;
        font-weight: 600;
      }

      .social-icons {
        display: flex;
        gap: 1rem;
      }

      .social-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        text-decoration: none;
        font-size: 1.5rem;
        transition: transform 0.25s, background-color 0.25s, box-shadow 0.25s;
      }

      .social-icon:hover {
        transform: translateY(-4px) scale(1.04);
        background-color: #b91c1c;
        box-shadow: 0 12px 22px rgba(185, 28, 28, 0.34);
      }

      .form-caption {
        color: #64748b;
        margin: -0.25rem 0 1rem 0;
        font-size: 0.92rem;
      }

      .contact-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      .form-input {
        padding: 0.875rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
        color: #1f2937;
        background-color: #ffffff;
        font-weight: 500;
      }

      .form-input:focus {
        outline: none;
        border-color: #dc2626;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        transform: translateY(-1px);
      }

      .form-input::placeholder {
        color: #9ca3af;
      }

      // Fix for autofill background
      .form-input:-webkit-autofill,
      .form-input:-webkit-autofill:hover,
      .form-input:-webkit-autofill:focus,
      .form-input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px white inset !important;
        -webkit-text-fill-color: #1f2937 !important;
        transition: background-color 5000s ease-in-out 0s;
      }

      textarea.form-input {
        resize: vertical;
        font-family: inherit;
      }

      .submit-button {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        padding: 1rem 2rem;
        border: none;
        border-radius: 8px;
        font-size: 1.125rem;
        font-weight: 700;
        cursor: pointer;
        transition:
          transform 0.3s,
          box-shadow 0.3s,
          filter 0.3s;
      }

      .submit-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3);
        filter: brightness(1.05);
      }

      .submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .map-section {
        background: linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.9));
        border-radius: 18px;
        padding: 2.5rem;
        border: 1px solid rgba(148, 163, 184, 0.26);
        box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
        animation: riseIn 0.62s ease both;
        animation-delay: 0.14s;
      }

      .map-section h2 {
        font-size: 1.75rem;
        color: #1f2937;
        margin-bottom: 1.5rem;
        font-weight: 700;
      }

      .map-placeholder {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-radius: 12px;
        padding: 4rem;
        text-align: center;
        border: 2px dashed #dc2626;
      }

      .map-placeholder p {
        font-size: 2rem;
        margin-bottom: 1rem;
      }

      .map-text {
        font-size: 1.125rem !important;
        color: #4b5563;
      }

      @media (max-width: 968px) {
        .content-wrapper {
          grid-template-columns: 1fr;
        }

        .contact-title {
          font-size: 2rem;
        }

        .contact-subtitle {
          font-size: 1.05rem;
        }

        .contact-info,
        .contact-form-section,
        .map-section {
          padding: 1.5rem;
        }

        .hero-points {
          justify-content: center;
        }
      }
    `,
  ],
})
export class ContactComponent {
  formData = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  };

  isSubmitting = false;

  constructor(private notificationService: NotificationService) {}

  submitForm(): void {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    // Simulate form submission
    setTimeout(() => {
      this.notificationService.success(
        "Message sent successfully! We will get back to you soon.",
      );

      // Reset form
      this.formData = {
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      };

      this.isSubmitting = false;
    }, 1500);
  }
}
