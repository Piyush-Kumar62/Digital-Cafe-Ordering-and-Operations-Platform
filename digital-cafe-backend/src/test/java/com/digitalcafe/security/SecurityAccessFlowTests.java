package com.digitalcafe.security;

import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.AdminDashboardService;
import com.digitalcafe.service.OrderService;
import com.digitalcafe.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
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

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private OrderService orderService;

    @MockBean
    private UserService userService;

    @MockBean
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
}
