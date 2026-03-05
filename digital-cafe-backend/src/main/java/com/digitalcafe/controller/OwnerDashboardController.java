package com.digitalcafe.controller;

import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.OwnerDashboardAnalyticsResponse;
import com.digitalcafe.service.CafeService;
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
    private final CafeService cafeService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<OwnerDashboardAnalyticsResponse>> getOwnerDashboard() {
        Long cafeId = getCafeIdFromAuthentication(SecurityContextHolder.getContext().getAuthentication());
        OwnerDashboardAnalyticsResponse response = ownerDashboardAnalyticsService.getOwnerDashboard(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Owner dashboard analytics retrieved successfully", response));
    }

    private Long getCafeIdFromAuthentication(Authentication authentication) {
        return cafeService.getCafeIdForUser(authentication.getName());
    }
}
