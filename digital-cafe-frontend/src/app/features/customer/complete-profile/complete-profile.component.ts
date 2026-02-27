import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "@environments/environment";
import { AuthService } from "@core/auth/auth.service";
import { NotificationService } from "@core/services/notification.service";

@Component({
  selector: "app-complete-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./complete-profile.component.html",
  styleUrls: ["./complete-profile.component.scss"],
})
export class CompleteProfileComponent {
  loading = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      firstName: ["", [Validators.required, Validators.maxLength(50)]],
      lastName: ["", [Validators.required, Validators.maxLength(50)]],
      dateOfBirth: ["", Validators.required],
      gender: ["", Validators.required],
      phoneNumber: ["", [Validators.required, Validators.pattern(/^[0-9]{10,20}$/)]],
      street: ["", Validators.required],
      city: ["", Validators.required],
      state: [""],
      country: ["India"],
      pincode: ["", Validators.required],
      institutionName: ["", Validators.required],
      degree: ["", Validators.required],
      fieldOfStudy: [""],
      academicStartDate: [""],
      academicEndDate: [""],
      grade: [""],
      isCurrent: [false],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const v = this.form.value;
    const payload = {
      firstName: v.firstName,
      lastName: v.lastName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      phoneNumber: v.phoneNumber,
      profilePictureUrl: null,
      address: {
        street: v.street,
        plotNumber: "",
        city: v.city,
        state: v.state,
        country: v.country,
        pincode: v.pincode,
      },
      academicInformation: [
        {
          institutionName: v.institutionName,
          degree: v.degree,
          fieldOfStudy: v.fieldOfStudy,
          startDate: v.academicStartDate || null,
          endDate: v.academicEndDate || null,
          grade: v.grade || null,
          isCurrent: !!v.isCurrent,
          description: null,
        },
      ],
      workExperiences: [],
    };

    this.http
      .post<{ data?: { completionPercentage?: number } }>(`${environment.apiUrl}/profiles`, payload)
      .subscribe({
        next: (res) => {
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            this.authService.updateUserData({
              ...currentUser,
              firstName: v.firstName,
              lastName: v.lastName,
              isProfileComplete: true,
              profileCompletionPercentage: res?.data?.completionPercentage ?? 100,
            });
          }

          this.notificationService.success("Profile completed successfully.");
          this.router.navigate(["/customer/menu"]);
        },
        error: (error) => {
          const message = error?.error?.message || "Failed to complete profile.";
          this.notificationService.error(message);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
