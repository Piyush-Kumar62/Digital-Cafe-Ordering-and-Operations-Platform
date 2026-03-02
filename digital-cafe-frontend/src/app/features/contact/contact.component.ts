import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";
import { AlertService } from "@core/services/alert.service";

@Component({
  selector: "app-contact",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent {
  formData = { name: '', email: '', phone: '', subject: '', message: '' };
  isSubmitting = false;

  constructor(private alertService: AlertService) {}

  submitForm(): void {
    this.isSubmitting = true;
    setTimeout(() => {
      this.alertService.success('Message Sent', 'Thank you for reaching out. We will get back to you shortly.');
      this.formData = { name: '', email: '', phone: '', subject: '', message: '' };
      this.isSubmitting = false;
    }, 1500);
  }
}
