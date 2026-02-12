package com.digitalcafe.controller;

import com.digitalcafe.dto.request.CreateUserRequest;
import com.digitalcafe.dto.response.AdminDashboardStats;
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

/**
 * Admin Controller for managing cafe owners and system operations.
 * Only accessible by users with ADMIN role.
 */
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

