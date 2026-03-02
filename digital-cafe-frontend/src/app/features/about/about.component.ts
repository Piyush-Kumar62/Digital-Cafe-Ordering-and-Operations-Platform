import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";

@Component({
  selector: "app-about",
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {}


