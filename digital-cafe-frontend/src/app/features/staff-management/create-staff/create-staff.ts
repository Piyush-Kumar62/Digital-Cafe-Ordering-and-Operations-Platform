import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  UserService,
  CreateStaffRequest,
  StaffCreationResponse,
} from '../../../core/services/user.service';

@Component({
  selector: 'app-create-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-staff.html',
  styleUrl: './create-staff.css',
})
export class CreateStaffComponent {
  // Form fields
  firstName = '';
  lastName = '';
  email = '';
  phoneNumber = '';
  role = 'CAFE_OWNER'; // Default to CAFE_OWNER for admin
  cafeId: number | null = null;

  // UI state
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showCafeIdField = false;
  createdAccount: StaffCreationResponse | null = null;

  // User role to determine what can be created
  currentUserRole = '';

  constructor(private userService: UserService) {
    // Get current user role from auth service
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserRole = user.role;

      // Set default role based on current user
      if (this.currentUserRole === 'CAFE_OWNER') {
        this.role = 'CHEF';
        this.showCafeIdField = true;
      }
    }
  }

  onRoleChange() {
    // Show cafe ID field for Chef and Waiter
    this.showCafeIdField = this.role === 'CHEF' || this.role === 'WAITER';
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.firstName || !this.lastName || !this.email || !this.phoneNumber) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    // Cafe ID validation for Chef and Waiter
    if ((this.role === 'CHEF' || this.role === 'WAITER') && !this.cafeId) {
      this.errorMessage = 'Cafe ID is required for Chef and Waiter roles';
      return;
    }

    this.isLoading = true;

    const request: CreateStaffRequest = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      role: this.role,
      cafeId: this.cafeId || undefined,
    };

    // Call appropriate service method based on role
    let serviceCall;
    if (this.role === 'CAFE_OWNER') {
      serviceCall = this.userService.createCafeOwner(request);
    } else if (this.role === 'CHEF') {
      serviceCall = this.userService.createChef(request);
    } else if (this.role === 'WAITER') {
      serviceCall = this.userService.createWaiter(request);
    } else {
      this.errorMessage = 'Invalid role selected';
      this.isLoading = false;
      return;
    }

    serviceCall.subscribe({
      next: (response: StaffCreationResponse) => {
        this.isLoading = false;
        this.successMessage = `${this.role} account created successfully!

Username: ${response.username}
Email: ${response.email}
Temporary Password: ${response.tempPassword}

Please save these credentials. The password must be changed on first login.`;

        this.firstName = '';
        this.lastName = '';
        this.email = '';
        this.phoneNumber = '';
        this.cafeId = null;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to create account. Please try again.';
      },
    });
  }

  getRoleOptions() {
    if (this.currentUserRole === 'ADMIN') {
      return [{ value: 'CAFE_OWNER', label: 'Café Owner' }];
    } else if (this.currentUserRole === 'CAFE_OWNER') {
      return [
        { value: 'CHEF', label: 'Chef' },
        { value: 'WAITER', label: 'Waiter' },
      ];
    }
    return [];
  }

  getPageTitle() {
    if (this.currentUserRole === 'ADMIN') {
      return 'Create Café Owner Account';
    } else if (this.currentUserRole === 'CAFE_OWNER') {
      return 'Create Staff Account';
    }
    return 'Create Account';
  }
}
