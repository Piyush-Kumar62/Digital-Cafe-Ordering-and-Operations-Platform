package com.digitalcafe.security;

import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.dto.response.AdminDashboardStats;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.AdminDashboardService;
import com.digitalcafe.service.OrderService;
import com.digitalcafe.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.Set;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAccessFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private AdminDashboardService adminDashboardService;

    @Test
    @WithMockUser(username = "customer-unverified@test.com", roles = "CUSTOMER")
    void shouldBlockCustomerWhenEmailNotVerified() throws Exception {
        User customer = User.builder()
                .id(100L)
                .email("customer-unverified@test.com")
                .isEmailVerified(false)
                .isProfileComplete(true)
                .roles(Set.of(Role.builder().name(Role.RoleName.CUSTOMER).build()))
                .build();

        when(userRepository.findByEmail("customer-unverified@test.com")).thenReturn(Optional.of(customer));

        mockMvc.perform(get("/api/orders/my-orders"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    @WithMockUser(username = "customer-incomplete@test.com", roles = "CUSTOMER")
    void shouldBlockCustomerWhenProfileIncomplete() throws Exception {
        User customer = User.builder()
                .id(101L)
                .email("customer-incomplete@test.com")
                .isEmailVerified(true)
                .isProfileComplete(false)
                .roles(Set.of(Role.builder().name(Role.RoleName.CUSTOMER).build()))
                .build();

        when(userRepository.findByEmail("customer-incomplete@test.com")).thenReturn(Optional.of(customer));

        mockMvc.perform(get("/api/orders/my-orders"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("PROFILE_INCOMPLETE"));
    }

    @Test
    @WithMockUser(username = "customer@test.com", roles = "CUSTOMER")
    void shouldRejectCustomerOnAdminRoute() throws Exception {
        User customer = User.builder()
                .id(102L)
                .email("customer@test.com")
                .isEmailVerified(true)
                .isProfileComplete(true)
                .roles(Set.of(Role.builder().name(Role.RoleName.CUSTOMER).build()))
                .build();

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));

        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner-incomplete@test.com", roles = "CAFE_OWNER")
    void shouldBlockOwnerWhenProfileIncomplete() throws Exception {
        User owner = User.builder()
                .id(103L)
                .email("owner-incomplete@test.com")
                .isEmailVerified(true)
                .isProfileComplete(false)
                .roles(Set.of(Role.builder().name(Role.RoleName.CAFE_OWNER).build()))
                .build();

        when(userRepository.findByEmail("owner-incomplete@test.com")).thenReturn(Optional.of(owner));

        mockMvc.perform(get("/api/orders/cafe/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("PROFILE_INCOMPLETE"));
    }

    @Test
    @WithMockUser(username = "chef-unverified@test.com", roles = "CHEF")
    void shouldBlockChefWhenEmailNotVerified() throws Exception {
        User chef = User.builder()
                .id(104L)
                .email("chef-unverified@test.com")
                .isEmailVerified(false)
                .isProfileComplete(true)
                .roles(Set.of(Role.builder().name(Role.RoleName.CHEF).build()))
                .build();

        when(userRepository.findByEmail("chef-unverified@test.com")).thenReturn(Optional.of(chef));

        mockMvc.perform(get("/api/orders/cafe/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void shouldAllowAdminEvenWhenEmailOrProfileFlagsAreFalse() throws Exception {
        when(adminDashboardService.getDashboardStats()).thenReturn(AdminDashboardStats.builder().build());

        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isOk());
    }
}

