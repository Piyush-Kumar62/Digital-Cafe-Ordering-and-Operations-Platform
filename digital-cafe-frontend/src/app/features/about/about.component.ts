import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";

@Component({
  selector: "app-about",
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: "./about.component.html",
  styleUrls: ["./about.component.scss"],
})
export class AboutComponent {}
