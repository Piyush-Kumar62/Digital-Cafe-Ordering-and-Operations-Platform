import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from "@angular/router";
import { trigger, transition, style, animate } from '@angular/animations';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('0.5s cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.4s cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class CookieConsentComponent implements OnInit {
  isVisible = false;
  showPreferences = false;
  
  preferences: CookiePreferences = {
    essential: true, // Always true
    analytics: false,
    marketing: false
  };

  private readonly CONSENT_KEY = 'cookie_consent_preferences';
  private readonly LEGACY_KEY = 'cookie_consent_status';

  ngOnInit(): void {
    this.checkConsent();
    this.maybeOpenFromPolicy();
  }

  private checkConsent(): void {
    // Migration from old basic key to new granular key
    const legacyStatus = localStorage.getItem(this.LEGACY_KEY);
    const granularStatus = localStorage.getItem(this.CONSENT_KEY);

    if (!granularStatus && !legacyStatus) {
      setTimeout(() => {
        this.isVisible = true;
      }, 1000);
    } else if (granularStatus) {
      this.preferences = JSON.parse(granularStatus);
    } else if (legacyStatus === 'accepted_all') {
      this.preferences = { essential: true, analytics: true, marketing: true };
      this.savePreferencesConfig();
    } else {
      this.preferences = { essential: true, analytics: false, marketing: false };
      this.savePreferencesConfig();
    }
  }

  openSettings(): void {
    this.showPreferences = true;
  }

  closeSettings(): void {
    this.showPreferences = false;
  }

  togglePreference(type: 'analytics' | 'marketing'): void {
    this.preferences[type] = !this.preferences[type];
  }

  acceptAll(): void {
    this.preferences = { essential: true, analytics: true, marketing: true };
    this.savePreferencesConfig();
  }

  rejectNonEssential(): void {
    this.preferences = { essential: true, analytics: false, marketing: false };
    this.savePreferencesConfig();
  }

  saveCustomPreferences(): void {
    this.savePreferencesConfig();
  }

  private savePreferencesConfig(): void {
    localStorage.setItem(this.CONSENT_KEY, JSON.stringify(this.preferences));
    // Clean up legacy key if needed
    localStorage.removeItem(this.LEGACY_KEY);
    this.isVisible = false;
    this.showPreferences = false;
  }

  private maybeOpenFromPolicy(): void {
    const openFlag = sessionStorage.getItem("cookie_open_settings");
    if (!openFlag) return;
    sessionStorage.removeItem("cookie_open_settings");
    this.isVisible = true;
    this.showPreferences = true;
  }
}
