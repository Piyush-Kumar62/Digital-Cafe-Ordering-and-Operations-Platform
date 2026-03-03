package com.digitalcafe.controller;

import com.digitalcafe.dto.request.CustomerSelfProfileUpdateDTO;
import com.digitalcafe.dto.response.ProfileImageUploadResponseDTO;
import com.digitalcafe.dto.response.CustomerSelfProfileResponseDTO;
import com.digitalcafe.service.CustomerSelfProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for authenticated user (customer) self-profile management.
 * Admin profile is managed by AdminProfileController at /api/admin/profile.
 */
@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final CustomerSelfProfileService customerSelfProfileService;

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
