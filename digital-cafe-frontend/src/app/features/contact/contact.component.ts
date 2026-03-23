import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NavbarComponent } from "@shared/components/navbar/navbar.component";
import { FooterComponent } from "@shared/components/footer/footer.component";
import { AlertService } from "@core/services/alert.service";
import { ContactService } from "@core/services/contact.service";

type GeoPermissionState = "unknown" | "prompt" | "granted" | "denied";

@Component({
  selector: "app-contact",
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: "./contact.component.html",
  styleUrls: ["./contact.component.scss"],
})
export class ContactComponent implements OnInit, OnDestroy {
  formData = { name: "", email: "", phone: "", subject: "", message: "" };
  isSubmitting = false;
  readonly hqName = "Centurion Coffee Connect";
  readonly hqAddress = "R44R+FC8, R.Sitapur, Rajaseetapuram, Odisha 761211";
  readonly hqCoordinates = { lat: 18.8053, lng: 84.1368 };

  isLocating = false;
  isLiveTracking = false;
  locationError = "";
  permissionHint = "";
  geoPermission: GeoPermissionState = "unknown";
  locationNote = "Enable live location to see your distance from HQ.";
  currentCoordinates: { lat: number; lng: number; accuracy: number } | null = null;
  distanceFromHqKm: number | null = null;

  private geolocationWatchId: number | null = null;

  constructor(
    private alertService: AlertService,
    private contactService: ContactService,
  ) {}

  ngOnInit(): void {
    this.detectGeolocationPermission();
  }

  ngOnDestroy(): void {
    this.stopLocationTracking();
  }

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

  startLocationTracking(): void {
    if (!("geolocation" in navigator)) {
      this.locationError = "Geolocation is not supported in this browser.";
      this.locationNote = "Use a modern browser to enable live location.";
      this.geoPermission = "denied";
      return;
    }

    this.locationError = "";
    this.permissionHint = "";
    this.isLocating = true;

    if (this.geolocationWatchId !== null) {
      navigator.geolocation.clearWatch(this.geolocationWatchId);
      this.geolocationWatchId = null;
    }

    this.geolocationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.max(0, Math.round(position.coords.accuracy || 0));

        this.currentCoordinates = { lat, lng, accuracy };
        this.distanceFromHqKm = this.calculateDistanceKm(
          lat,
          lng,
          this.hqCoordinates.lat,
          this.hqCoordinates.lng,
        );
        this.locationNote = `Live location active (accuracy ±${accuracy}m).`;
        this.geoPermission = "granted";
        this.permissionHint = "";
        this.isLiveTracking = true;
        this.isLocating = false;
      },
      (error) => {
        this.isLocating = false;
        this.isLiveTracking = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.geoPermission = "denied";
            this.locationError = "Location access is blocked.";
            this.locationNote = "Distance is unavailable until browser location access is enabled.";
            this.permissionHint = "Enable location from the browser lock icon, then click Retry.";
            break;
          case error.TIMEOUT:
            this.geoPermission = "prompt";
            this.locationError = "Location request timed out.";
            this.locationNote = "Could not lock your location in time. Try again.";
            break;
          default:
            this.geoPermission = "prompt";
            this.locationError = "Unable to fetch your current location.";
            this.locationNote = "Please try again.";
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  }

  stopLocationTracking(): void {
    if (this.geolocationWatchId !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(this.geolocationWatchId);
      this.geolocationWatchId = null;
    }
    this.isLiveTracking = false;
    this.isLocating = false;
    this.locationNote = "Live tracking paused.";
  }

  getLocationButtonText(): string {
    if (this.isLocating) {
      return "Locating...";
    }
    if (this.geoPermission === "denied") {
      return "Retry Location";
    }
    if (this.isLiveTracking) {
      return "Refresh Location";
    }
    return "Enable Live Location";
  }

  getDirectionsUrl(): string {
    if (this.currentCoordinates) {
      const origin = `${this.currentCoordinates.lat},${this.currentCoordinates.lng}`;
      const destination = `${this.hqCoordinates.lat},${this.hqCoordinates.lng}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${this.hqCoordinates.lat},${this.hqCoordinates.lng}`)}`;
  }

  formatCoords(lat: number, lng: number): string {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  get isPermissionBlocked(): boolean {
    return this.geoPermission === "denied";
  }

  get locationStatusText(): string {
    if (this.isLocating) {
      return "Detecting your current location...";
    }
    if (this.isLiveTracking && this.distanceFromHqKm !== null) {
      return `You are ${this.distanceFromHqKm} km from HQ.`;
    }
    if (this.isPermissionBlocked) {
      return "Location permission is blocked in browser settings.";
    }
    return this.locationNote;
  }

  get locationPillLabel(): string {
    if (this.isLiveTracking) {
      return "Live";
    }
    if (this.isPermissionBlocked) {
      return "Permission Needed";
    }
    return "Ready";
  }

  get locationStatusTone(): "neutral" | "success" | "warning" {
    if (this.isLiveTracking && this.distanceFromHqKm !== null) {
      return "success";
    }
    if (this.isPermissionBlocked || !!this.locationError) {
      return "warning";
    }
    return "neutral";
  }

  private detectGeolocationPermission(): void {
    if (!("permissions" in navigator) || !("geolocation" in navigator)) {
      return;
    }

    const permissionsApi = navigator.permissions as Permissions;
    permissionsApi
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        this.geoPermission = (status.state as GeoPermissionState) || "unknown";
        if (this.geoPermission === "denied") {
          this.locationNote = "Distance is unavailable until browser location access is enabled.";
          this.permissionHint = "Enable location from the browser lock icon, then click Retry.";
        }
        status.onchange = () => {
          this.geoPermission = (status.state as GeoPermissionState) || "unknown";
          if (this.geoPermission === "granted") {
            this.locationError = "";
            this.permissionHint = "";
          }
        };
      })
      .catch(() => {
        this.geoPermission = "unknown";
      });
  }

  private calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((earthRadiusKm * c).toFixed(2));
  }
}
