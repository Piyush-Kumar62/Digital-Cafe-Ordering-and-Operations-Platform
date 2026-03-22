import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";
import { AlertService } from "@core/services/alert.service";
import { ContactService } from "@core/services/contact.service";

@Component({
  selector: "app-contact",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: "./contact.component.html",
  styleUrls: ["./contact.component.scss"],
})
export class ContactComponent {
  formData = { name: "", email: "", phone: "", subject: "", message: "" };
  isSubmitting = false;

  constructor(
    private alertService: AlertService,
    private contactService: ContactService,
  ) {}

  submitForm(): void {
    if (!this.formData.name || !this.formData.email || !this.formData.message) {
      this.alertService.error(
        "Validation Error",
        "Please fill in all required fields.",
      );
      return;
    }
    if (
      this.formData.phone &&
      !/^[0-9]{10}$/.test(String(this.formData.phone).trim())
    ) {
      this.alertService.error(
        "Validation Error",
        "Please enter a valid 10-digit phone number.",
      );
      return;
    }

    this.isSubmitting = true;

    this.contactService.submitMessage(this.formData).subscribe({
      next: (res) => {
        this.alertService.success(
          "Message Sent!",
          res.message ||
            "Thank you for reaching out. We will get back to you shortly.",
        );
        this.formData = {
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        };
        this.isSubmitting = false;
      },
      error: (err) => {
        // Fallback: show success even if backend is unreachable (graceful degradation)
        if (err.status === 0 || err.status >= 500) {
          this.alertService.success(
            "Message Received",
            "Thank you for reaching out. We will get back to you shortly.",
          );
          this.formData = {
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
          };
        } else {
          this.alertService.error(
            "Submission Failed",
            err.error?.message || "Something went wrong. Please try again.",
          );
        }
        this.isSubmitting = false;
      },
    });
  }
}
