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
        <h1 class="contact-title">Contact Us</h1>
        <p class="contact-subtitle">
          Have questions? We'd love to hear from you. Send us a message and
          we'll respond as soon as possible.
        </p>

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
                <a href="#" class="social-icon">📘</a>
                <a href="#" class="social-icon">📸</a>
                <a href="#" class="social-icon">🐦</a>
                <a href="#" class="social-icon">💼</a>
              </div>
            </div>
          </div>

          <div class="contact-form-section">
            <h2>Send us a Message</h2>
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
        background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
        padding: 3rem 1rem;
      }

      .contact-content {
        max-width: 1200px;
        margin: 0 auto;
      }

      .contact-title {
        font-size: 3rem;
        color: #dc2626;
        text-align: center;
        margin-bottom: 1rem;
        font-weight: 800;
      }

      .contact-subtitle {
        text-align: center;
        font-size: 1.25rem;
        color: #4b5563;
        margin-bottom: 3rem;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
      }

      .content-wrapper {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
        gap: 2rem;
        margin-bottom: 3rem;
      }

      .contact-info,
      .contact-form-section {
        background: white;
        border-radius: 12px;
        padding: 2.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
        background: #fef2f2;
        border-radius: 8px;
        border-left: 4px solid #dc2626;
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
        transition:
          transform 0.3s,
          background-color 0.3s;
      }

      .social-icon:hover {
        transform: translateY(-5px);
        background-color: #b91c1c;
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
        transition: border-color 0.3s;
      }

      .form-input:focus {
        outline: none;
        border-color: #dc2626;
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
          box-shadow 0.3s;
      }

      .submit-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(220, 38, 38, 0.3);
      }

      .submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .map-section {
        background: white;
        border-radius: 12px;
        padding: 2.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .map-section h2 {
        font-size: 1.75rem;
        color: #1f2937;
        margin-bottom: 1.5rem;
        font-weight: 700;
      }

      .map-placeholder {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-radius: 8px;
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

        .contact-info,
        .contact-form-section,
        .map-section {
          padding: 1.5rem;
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
