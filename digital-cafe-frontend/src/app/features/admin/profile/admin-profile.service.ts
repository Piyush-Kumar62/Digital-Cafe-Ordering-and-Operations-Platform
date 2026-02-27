import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@core/services/api.service";
import {
  AdminProfile,
  AdminProfileUpdateRequest,
  ProfileImageUploadResponse,
} from "@shared/models/admin-profile.model";

@Injectable({
  providedIn: "root",
})
export class AdminProfileService {
  constructor(private apiService: ApiService) {}

  getProfile(): Observable<AdminProfile> {
    return this.apiService.getAdminProfile();
  }

  updateProfile(request: AdminProfileUpdateRequest): Observable<AdminProfile> {
    return this.apiService.updateAdminProfile(request);
  }

  uploadProfileImage(file: File): Observable<ProfileImageUploadResponse> {
    return this.apiService.uploadAdminProfileImage(file);
  }

  deleteProfileImage(): Observable<void> {
    return this.apiService.deleteAdminProfileImage();
  }
}
