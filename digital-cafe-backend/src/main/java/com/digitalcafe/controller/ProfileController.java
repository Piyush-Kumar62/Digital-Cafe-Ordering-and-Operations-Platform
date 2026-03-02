package com.digitalcafe.controller;

import com.digitalcafe.dto.request.ProfileRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.ProfileResponse;
import com.digitalcafe.exception.AccessDeniedException;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProfileResponse>> createOrUpdateProfile(
            @Valid @RequestBody ProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);

        ProfileResponse response = profileService.createOrUpdateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);

        ProfileResponse response = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER', 'CUSTOMER')")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfileByUserId(@PathVariable Long userId) {
        authorizeProfileRead(userId);
        ProfileResponse response = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", response));
    }

    @GetMapping("/me/completion")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Integer>> getProfileCompletion() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = getUserIdFromAuthentication(authentication);

        int completion = profileService.calculateProfileCompletion(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile completion retrieved successfully", completion));
    }

    @PostMapping("/{userId}/academic")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProfileResponse>> addAcademicInfo(
            @PathVariable Long userId,
            @Valid @RequestBody ProfileRequest.AcademicInfoRequest request) {
        authorizeProfileMutation(userId);
        ProfileResponse response = profileService.addAcademicInfo(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Academic information added successfully", response));
    }

    @PostMapping("/{userId}/work-experience")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProfileResponse>> addWorkExperience(
            @PathVariable Long userId,
            @Valid @RequestBody ProfileRequest.WorkExperienceRequest request) {
        authorizeProfileMutation(userId);
        ProfileResponse response = profileService.addWorkExperience(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Work experience added successfully", response));
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    private void authorizeProfileMutation(Long targetUserId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long authenticatedUserId = getUserIdFromAuthentication(authentication);
        Set<String> roles = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toSet());
        boolean hasAdminPrivileges = roles.contains("ADMIN") || roles.contains("CAFE_OWNER");
        if (!hasAdminPrivileges && !authenticatedUserId.equals(targetUserId)) {
            throw new AccessDeniedException("You are not allowed to modify this profile");
        }
    }

    private void authorizeProfileRead(Long targetUserId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long authenticatedUserId = getUserIdFromAuthentication(authentication);
        Set<String> roles = authentication.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toSet());
        boolean hasStaffPrivileges = roles.contains("ADMIN") || roles.contains("CAFE_OWNER");
        if (!hasStaffPrivileges && !authenticatedUserId.equals(targetUserId)) {
            throw new AccessDeniedException("You are not allowed to access this profile");
        }
    }
}
