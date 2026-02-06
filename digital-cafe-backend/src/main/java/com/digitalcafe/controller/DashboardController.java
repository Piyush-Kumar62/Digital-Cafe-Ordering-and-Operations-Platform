package com.digitalcafe.controller;

import com.digitalcafe.dto.*;
import com.digitalcafe.model.User;
import com.digitalcafe.service.DashboardService;
import com.digitalcafe.config.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardDTO> getAdminDashboard() {
        AdminDashboardDTO dashboard = dashboardService.getAdminDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/owner")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<OwnerDashboardDTO> getOwnerDashboard(HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        String username = jwtUtil.extractUsername(token);
        Long userId = jwtUtil.extractUserId(token);
        
        OwnerDashboardDTO dashboard = dashboardService.getOwnerDashboard(userId);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/chef/{cafeId}")
    @PreAuthorize("hasRole('CHEF')")
    public ResponseEntity<ChefDashboardDTO> getChefDashboard(@PathVariable Long cafeId) {
        ChefDashboardDTO dashboard = dashboardService.getChefDashboard(cafeId);
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/waiter/{cafeId}")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<WaiterDashboardDTO> getWaiterDashboard(@PathVariable Long cafeId) {
        WaiterDashboardDTO dashboard = dashboardService.getWaiterDashboard(cafeId);
        return ResponseEntity.ok(dashboard);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
