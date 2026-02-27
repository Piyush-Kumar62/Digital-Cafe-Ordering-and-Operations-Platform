import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-setup-cafe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './setup-cafe.component.html',
  styleUrls: ['./setup-cafe.component.scss']
})
export class SetupCafeComponent implements OnInit {

  cafeId: number | null = null;
  isEditMode = false;

  cafeForm!: FormGroup;

  selectedFile!: File | null;
  previewUrl: string | null = null;

  loading = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private notification: NotificationService
  ) {}

  // ================= INIT =================
  ngOnInit(): void {

    // Create Form
    this.cafeForm = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      landmark: [''],
      phoneNumber: ['', Validators.required],
      pincode: ['', Validators.required],
      openingTime: [''],
      closingTime: [''],
      fssaiNumber: [''],
      gstNumber: [''],
      msmeNumber: ['']
    });

    // Detect Edit Mode
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.cafeId = +params['id'];
        this.isEditMode = true;
        this.loadCafeForEdit();
      }
    });
  }

  // ================= FILE SELECT =================
  onFileChange(event: any): void {

    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // ================= LOAD CAFE FOR EDIT =================
  loadCafeForEdit(): void {

    if (!this.cafeId) return;

    this.loading = true;

    this.apiService.getCafeById(this.cafeId).subscribe({
      next: (res: any) => {

        const cafe = res.data ? res.data : res;

        // Prefill Form
        this.cafeForm.patchValue({
          name: cafe.name,
          address: cafe.address,
          city: cafe.city,
          landmark: cafe.landmark,
          phoneNumber: cafe.phoneNumber,
          pincode: cafe.pincode,
          openingTime: cafe.openTime,
          closingTime: cafe.closeTime,
          fssaiNumber: cafe.fssaiNumber,
          gstNumber: cafe.gstNumber,
          msmeNumber: cafe.msmeNumber
        });

        // Show existing logo if present
        if (cafe.logoUrl) {
          this.previewUrl = 'http://localhost:8080' + cafe.logoUrl;
        }

        this.loading = false;
      },
      error: () => {
        this.notification.error('Failed to load cafe');
        this.loading = false;
      }
    });
  }

  // ================= SUBMIT (CREATE + UPDATE) =================
  submit(): void {

    if (this.cafeForm.invalid) return;

    const formData = new FormData();

    // Send JSON Data
    formData.append(
      'data',
      new Blob(
        [JSON.stringify(this.cafeForm.value)],
        { type: 'application/json' }
      )
    );

    // Send Logo (Optional)
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }

    this.loading = true;

    // ================= UPDATE =================
    if (this.isEditMode && this.cafeId) {

      this.apiService.updateCafeSetup(this.cafeId, formData).subscribe({
        next: () => {
          this.notification.success('Cafe updated successfully');
          this.router.navigate(['/owner/settings']);
        },
        error: () => {
          this.notification.error('Update failed');
          this.loading = false;
        }
      });

    }

    // ================= CREATE =================
    else {

      this.apiService.createCafeSetup(formData).subscribe({
        next: () => {
          this.successMessage = 'Café created successfully!';
          this.cafeForm.reset();
          this.previewUrl = null;

          setTimeout(() => {
            this.router.navigate(['/owner/settings']);
          }, 500);
        },
        error: () => {
          this.notification.error('Creation failed');
          this.loading = false;
        }
      });

    }
  }
}