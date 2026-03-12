package com.digitalcafe.controller;

import com.digitalcafe.dto.response.AdminDashboardAnalyticsResponse;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.AdminDashboardStats;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.dto.response.PaymentWebhookEventResponse;
import com.digitalcafe.dto.response.UserResponse;
import com.digitalcafe.service.AdminDashboardService;
import com.digitalcafe.service.PaymentWebhookAuditService;
import com.digitalcafe.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Manages system-wide operations: user/approval management and analytics.
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AdminDashboardService adminDashboardService;
    private final PaymentWebhookAuditService paymentWebhookAuditService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStats>> getDashboardStats() {
        AdminDashboardStats stats = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard stats retrieved successfully", stats));
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

    @GetMapping("/payment-webhooks")
    public ResponseEntity<ApiResponse<PageResponse<PaymentWebhookEventResponse>>> getPaymentWebhookEvents(Pageable pageable) {
        PageResponse<PaymentWebhookEventResponse> response = paymentWebhookAuditService.getWebhookEvents(pageable);
        return ResponseEntity.ok(ApiResponse.success("Payment webhook events retrieved successfully", response));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(Pageable pageable) {
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    @GetMapping("/users/role/{roleName}")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByRole(@PathVariable String roleName) {
        List<UserResponse> users = userService.getUsersByRole(roleName);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    @GetMapping("/pending-users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getPendingUsers() {
        return ResponseEntity.ok(ApiResponse.success("Pending users retrieved successfully", userService.getPendingApprovalUsers()));
    }

    @PutMapping("/approve/{userId}")
    public ResponseEntity<ApiResponse<Void>> approveUser(@PathVariable Long userId) {
        userService.approveUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User approved successfully", (Void) null));
    }

    @PutMapping("/reject/{userId}")
    public ResponseEntity<ApiResponse<Void>> rejectUser(@PathVariable Long userId) {
        userService.rejectUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User rejected successfully", (Void) null));
    }

    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable Long id) {
        userService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", (Void) null));
    }

    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", (Void) null));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", (Void) null));
    }

}

