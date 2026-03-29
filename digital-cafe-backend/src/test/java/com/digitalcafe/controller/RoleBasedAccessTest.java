package com.digitalcafe.controller;

import com.digitalcafe.dto.response.AdminDashboardStats;
import com.digitalcafe.security.JwtAuthenticationFilter;
import com.digitalcafe.security.JwtUtil;
import com.digitalcafe.security.ProfileCompletionFilter;
import com.digitalcafe.service.AdminDashboardService;
import com.digitalcafe.service.PaymentWebhookAuditService;
import com.digitalcafe.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(RoleBasedAccessTest.MethodSecurityConfig.class)
class RoleBasedAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private AdminDashboardService adminDashboardService;

    @MockitoBean
    private PaymentWebhookAuditService paymentWebhookAuditService;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private ProfileCompletionFilter profileCompletionFilter;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void customerShouldBeForbiddenFromAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminShouldAccessAdminEndpoints() throws Exception {
        when(adminDashboardService.getDashboardStats())
                .thenReturn(AdminDashboardStats.builder().totalUsers(1L).build());

        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isOk());
    }

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityConfig {
    }
}

