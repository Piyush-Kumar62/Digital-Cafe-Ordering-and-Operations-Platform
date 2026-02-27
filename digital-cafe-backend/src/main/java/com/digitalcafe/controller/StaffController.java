package com.digitalcafe.controller;

import com.digitalcafe.dto.request.CreateStaffRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.UserResponse;
import com.digitalcafe.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing cafe staff (Chef and Waiter).
 */
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final UserService userService;

    // ================= CREATE STAFF =================

    @PostMapping
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {

        UserResponse response = userService.createStaffByOwner(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Staff created successfully. Credentials sent via email.", response));
    }

    @PutMapping("/{staffId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> updateStaff(
            @PathVariable Long staffId,
            @RequestBody CreateStaffRequest request) {

        UserResponse response = userService.updateStaffByOwner(staffId, request);
        return ResponseEntity.ok(ApiResponse.success("Staff updated successfully", response));
    }
    // ================= GET STAFF BY CAFE =================

    @GetMapping("/cafe/{cafeId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getStaffByCafeId(@PathVariable Long cafeId) {

        List<UserResponse> response = userService.getStaffByCafeId(cafeId);

        return ResponseEntity.ok(ApiResponse.success("Staff retrieved successfully", response));
    }

    // ================= ACTIVATE =================

    @PatchMapping("/{staffId}/activate")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> activateStaff(@PathVariable Long staffId) {

        UserResponse response = userService.toggleUserStatus(staffId, true);

        return ResponseEntity.ok(ApiResponse.success("Staff activated successfully", response));
    }

    // ================= DEACTIVATE =================

    @PatchMapping("/{staffId}/deactivate")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> deactivateStaff(@PathVariable Long staffId) {

        UserResponse response = userService.toggleUserStatus(staffId, false);

        return ResponseEntity.ok(ApiResponse.success("Staff deactivated successfully", response));
    }
}
