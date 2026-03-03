package com.digitalcafe.controller;

import com.digitalcafe.dto.request.AdminProfileUpdateDTO;
import com.digitalcafe.dto.response.AdminProfileResponseDTO;
import com.digitalcafe.dto.response.ProfileImageUploadResponseDTO;
import com.digitalcafe.service.AdminProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for admin profile management.
 * All endpoints require ROLE_ADMIN.
 * Mapped to /api/admin — covered by SecurityConfig's hasRole('ADMIN') rule.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProfileController {

    private final AdminProfileService adminProfileService;

    /**
     * GET /api/admin/profile
     * Returns the authenticated admin's profile.
     */
    @GetMapping("/profile")
    public ResponseEntity<AdminProfileResponseDTO> getProfile(Authentication authentication) {
        return ResponseEntity.ok(adminProfileService.getAuthenticatedAdminProfile(authentication));
    }

    /**
     * PUT /api/admin/profile
     * Updates the authenticated admin's profile (name, display name, preferences).
     */
    @PutMapping("/profile")
    public ResponseEntity<AdminProfileResponseDTO> updateProfile(
            Authentication authentication,
            @Valid @RequestBody AdminProfileUpdateDTO request
    ) {
        return ResponseEntity.ok(
                adminProfileService.updateAuthenticatedAdminProfile(authentication, request)
        );
    }

    /**
     * POST /api/admin/profile/image
     * Uploads or replaces the admin's profile image.
     * Accepts multipart/form-data with field name "file".
     * Validates: jpg/jpeg/png only, max 2 MB.
     */
    @PostMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileImageUploadResponseDTO> uploadProfileImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        String imageUrl = adminProfileService.updateAuthenticatedAdminProfileImage(authentication, file);
        return ResponseEntity.ok(new ProfileImageUploadResponseDTO(imageUrl));
    }

    /**
     * DELETE /api/admin/profile/image
     * Removes the admin's profile image.
     */
    @DeleteMapping("/profile/image")
    public ResponseEntity<Void> deleteProfileImage(Authentication authentication) {
        adminProfileService.removeAuthenticatedAdminProfileImage(authentication);
        return ResponseEntity.noContent().build();
    }
}
