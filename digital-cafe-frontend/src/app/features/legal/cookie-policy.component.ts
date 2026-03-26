import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";

@Component({
  selector: "app-cookie-policy",
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: "./cookie-policy.component.html",
  styleUrls: ["./cookie-policy.component.scss"],
})
export class CookiePolicyComponent {
  openCookieSettings(): void {
    localStorage.removeItem("cookie_consent_preferences");
    localStorage.removeItem("cookie_consent_status");
    sessionStorage.setItem("cookie_open_settings", "true");
    window.location.reload();
  }
}
