import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Profile } from "@shared/models/profile.model";

@Component({
  selector: "app-my-profile",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
})
export class MyProfileComponent implements OnInit {
  profile: Profile | null = null;
  loadError = "";

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getCustomerProfile().subscribe({
      next: (profile) => this.profile = profile as Profile,
      error: () => {
        this.loadError = "Unable to load profile details right now.";
      },
    });
  }
}
