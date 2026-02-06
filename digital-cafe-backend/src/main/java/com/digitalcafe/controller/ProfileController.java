package com.digitalcafe.controller;

import com.digitalcafe.dto.*;
import com.digitalcafe.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<?> getProfile(@PathVariable Long userId) {
        try {
            ProfileDTO profile = profileService.getProfileByUserId(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", profile);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<?> updateProfile(@PathVariable Long userId, @RequestBody ProfileDTO profileDTO) {
        try {
            ProfileDTO profile = profileService.updateProfile(userId, profileDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Profile updated successfully");
            response.put("data", profile);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/{userId}/academic")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<?> addAcademicInfo(@PathVariable Long userId, @RequestBody AcademicInfoDTO academicInfoDTO) {
        try {
            AcademicInfoDTO academicInfo = profileService.addAcademicInfo(userId, academicInfoDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Academic info added successfully");
            response.put("data", academicInfo);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/{userId}/work-experience")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<?> addWorkExperience(@PathVariable Long userId, @RequestBody WorkExperienceDTO workExperienceDTO) {
        try {
            WorkExperienceDTO workExp = profileService.addWorkExperience(userId, workExperienceDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Work experience added successfully");
            response.put("data", workExp);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/{userId}/address")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<?> updateAddress(@PathVariable Long userId, @RequestBody AddressDTO addressDTO) {
        try {
            AddressDTO address = profileService.updateAddress(userId, addressDTO);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Address updated successfully");
            response.put("data", address);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/{userId}/completion")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<?> getCompletionPercentage(@PathVariable Long userId) {
        try {
            Integer percentage = profileService.getCompletionPercentage(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", Map.of("completionPercentage", percentage));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
