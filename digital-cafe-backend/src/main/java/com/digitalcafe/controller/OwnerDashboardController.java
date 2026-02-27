package com.digitalcafe.controller;

import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.OwnerDashboardAnalyticsResponse;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.OwnerDashboardAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
public class OwnerDashboardController {

    private final OwnerDashboardAnalyticsService ownerDashboardAnalyticsService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<OwnerDashboardAnalyticsResponse>> getOwnerDashboard() {
        Long cafeId = getCafeIdFromAuthentication(SecurityContextHolder.getContext().getAuthentication());
        OwnerDashboardAnalyticsResponse response = ownerDashboardAnalyticsService.getOwnerDashboard(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Owner dashboard analytics retrieved successfully", response));
    }

    private Long getCafeIdFromAuthentication(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
        if (user.getCafe() == null || user.getCafe().getId() == null) {
            throw new IllegalArgumentException("Authenticated cafe owner is not assigned to any cafe");
        }
        return user.getCafe().getId();
    }
}
