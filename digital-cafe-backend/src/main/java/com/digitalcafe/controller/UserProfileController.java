package com.digitalcafe.controller;

import com.digitalcafe.dto.request.AdminProfileUpdateDTO;
import com.digitalcafe.dto.request.CustomerSelfProfileUpdateDTO;
import com.digitalcafe.dto.response.AdminProfileResponseDTO;
import com.digitalcafe.dto.response.ProfileImageUploadResponseDTO;
import com.digitalcafe.dto.response.CustomerSelfProfileResponseDTO;
import com.digitalcafe.service.AdminProfileService;
import com.digitalcafe.service.CustomerSelfProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final AdminProfileService adminProfileService;
    private final CustomerSelfProfileService customerSelfProfileService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminProfileResponseDTO> getProfile(Authentication authentication) {
        return ResponseEntity.ok(adminProfileService.getAuthenticatedAdminProfile(authentication));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminProfileResponseDTO> updateProfile(
            Authentication authentication,
            @Valid @RequestBody AdminProfileUpdateDTO request
    ) {
        return ResponseEntity.ok(adminProfileService.updateAuthenticatedAdminProfile(authentication, request));
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfileImageUploadResponseDTO> uploadProfileImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        String imageUrl = adminProfileService.updateAuthenticatedAdminProfileImage(authentication, file);
        return ResponseEntity.ok(new ProfileImageUploadResponseDTO(imageUrl));
    }

    @DeleteMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProfileImage(Authentication authentication) {
        adminProfileService.removeAuthenticatedAdminProfileImage(authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/self")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CustomerSelfProfileResponseDTO> getSelfProfile(Authentication authentication) {
        return ResponseEntity.ok(customerSelfProfileService.getProfile(authentication));
    }

    @PutMapping("/self")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CustomerSelfProfileResponseDTO> updateSelfProfile(
            Authentication authentication,
            @Valid @RequestBody CustomerSelfProfileUpdateDTO request
    ) {
        return ResponseEntity.ok(customerSelfProfileService.updateProfile(authentication, request));
    }

    @PostMapping(value = "/self/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProfileImageUploadResponseDTO> uploadSelfProfileImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        String imageUrl = customerSelfProfileService.updateProfileImage(authentication, file);
        return ResponseEntity.ok(new ProfileImageUploadResponseDTO(imageUrl));
    }

    @DeleteMapping("/self/image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteSelfProfileImage(Authentication authentication) {
        customerSelfProfileService.deleteProfileImage(authentication);
        return ResponseEntity.noContent().build();
    }
}
