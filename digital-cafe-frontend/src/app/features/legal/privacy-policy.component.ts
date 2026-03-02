import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";

@Component({
  selector: "app-privacy-policy",
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
})
export class PrivacyPolicyComponent {}

