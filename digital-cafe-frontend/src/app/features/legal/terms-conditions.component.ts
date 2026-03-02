import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";

@Component({
  selector: "app-terms-conditions",
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './terms-conditions.component.html',
  styleUrls: ['./terms-conditions.component.scss'],
})
export class TermsConditionsComponent {}

