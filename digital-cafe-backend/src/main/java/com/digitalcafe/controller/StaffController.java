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

    @PostMapping("/chef")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> createChef(@Valid @RequestBody CreateStaffRequest request) {
        UserResponse response = userService.createStaff(request, "CHEF");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chef created successfully. Credentials sent via email.", response));
    }

    @PostMapping("/waiter")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> createWaiter(@Valid @RequestBody CreateStaffRequest request) {
        UserResponse response = userService.createStaff(request, "WAITER");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Waiter created successfully. Credentials sent via email.", response));
    }

    @GetMapping("/cafe/{cafeId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getStaffByCafeId(@PathVariable Long cafeId) {
        List<UserResponse> response = userService.getStaffByCafeId(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Staff retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}/chefs")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getChefsByCafeId(@PathVariable Long cafeId) {
        List<UserResponse> response = userService.getChefsByCafeId(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Chefs retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}/waiters")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getWaitersByCafeId(@PathVariable Long cafeId) {
        List<UserResponse> response = userService.getWaitersByCafeId(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Waiters retrieved successfully", response));
    }

    @PatchMapping("/{staffId}/activate")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> activateStaff(@PathVariable Long staffId) {
        UserResponse response = userService.toggleUserStatus(staffId, true);
        return ResponseEntity.ok(ApiResponse.success("Staff activated successfully", response));
    }

    @PatchMapping("/{staffId}/deactivate")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<UserResponse>> deactivateStaff(@PathVariable Long staffId) {
        UserResponse response = userService.toggleUserStatus(staffId, false);
        return ResponseEntity.ok(ApiResponse.success("Staff deactivated successfully", response));
    }
}

