package com.digitalcafe.controller;

import com.digitalcafe.dto.request.CreateUserRequest;
import com.digitalcafe.dto.response.AdminDashboardAnalyticsResponse;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.AdminDashboardStats;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.dto.response.UserResponse;
import com.digitalcafe.service.AdminDashboardService;
import com.digitalcafe.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Manages system-wide operations and cafe owner provisioning.
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AdminDashboardService adminDashboardService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<AdminDashboardStats> getDashboardStats() {
        AdminDashboardStats stats = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardAnalyticsResponse>> getDashboardAnalytics() {
        AdminDashboardAnalyticsResponse response = adminDashboardService.getDashboardAnalytics();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard analytics retrieved successfully", response));
    }

    @GetMapping("/activities")
    public ResponseEntity<ApiResponse<PageResponse<AdminDashboardAnalyticsResponse.RecentActivityPoint>>> getActivities(Pageable pageable) {
        PageResponse<AdminDashboardAnalyticsResponse.RecentActivityPoint> response = adminDashboardService.getActivities(pageable);
        return ResponseEntity.ok(ApiResponse.success("Admin activities retrieved successfully", response));
    }

    @PostMapping("/cafe-owners")
    public ResponseEntity<UserResponse> createCafeOwner(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createCafeOwner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/users/role/{roleName}")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable String roleName) {
        List<UserResponse> users = userService.getUsersByRole(roleName);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/pending-users")
    public ResponseEntity<List<UserResponse>> getPendingUsers() {
        return ResponseEntity.ok(userService.getPendingApprovalUsers());
    }

    @PutMapping("/approve/{userId}")
    public ResponseEntity<Map<String, String>> approveUser(@PathVariable Long userId) {
        userService.approveUser(userId);
        return ResponseEntity.ok(Map.of("message", "User approved successfully"));
    }

    @PutMapping("/reject/{userId}")
    public ResponseEntity<Map<String, String>> rejectUser(@PathVariable Long userId) {
        userService.rejectUser(userId);
        return ResponseEntity.ok(Map.of("message", "User rejected successfully"));
    }

    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok(Map.of("message", "User activated successfully"));
    }

    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(Map.of("message", "User deactivated successfully"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}

