import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ApiService } from "@core/services/api.service";
import { Profile } from "@shared/models/profile.model";

@Component({
  selector: "app-my-profile",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="page">
      <header>
        <h1>My Profile</h1>
        <p>Profile details used for bookings and orders.</p>
      </header>

      <article class="card" *ngIf="profile; else loading">
        <div class="row"><strong>Phone:</strong> <span>{{ profile.phoneNumber || '-' }}</span></div>
        <div class="row"><strong>Date of Birth:</strong> <span>{{ profile.dateOfBirth || '-' }}</span></div>
        <div class="row"><strong>Gender:</strong> <span>{{ profile.gender || '-' }}</span></div>
        <div class="row"><strong>Completion:</strong> <span>{{ profile.profileCompletionPercentage || 0 }}%</span></div>
        <div class="row"><strong>Address:</strong>
          <span>
            {{ profile.address?.street || '-' }},
            {{ profile.address?.city || '-' }},
            {{ profile.address?.zipCode || '-' }}
          </span>
        </div>
        <div class="actions">
          <a routerLink="/customer/complete-profile">Update Profile</a>
        </div>
      </article>

      <ng-template #loading>
        <div class="card" *ngIf="!loadError">Loading profile...</div>
        <div class="card" *ngIf="loadError">{{ loadError }}</div>
      </ng-template>
    </section>
  `,
  styles: [`
    .page { padding: 1rem; }
    header h1 { margin: 0; }
    header p { color: #64748b; margin: .4rem 0 1rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
    .row { display: flex; gap: .65rem; margin: .45rem 0; color: #334155; flex-wrap: wrap; }
    .actions { margin-top: 1rem; }
    .actions a { color: #2563eb; font-weight: 600; }
  `],
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
