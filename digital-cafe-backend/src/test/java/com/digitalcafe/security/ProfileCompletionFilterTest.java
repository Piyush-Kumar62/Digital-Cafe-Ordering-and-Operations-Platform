package com.digitalcafe.security;

import com.digitalcafe.entity.User;
import com.digitalcafe.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfileCompletionFilterTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ProfileCompletionFilter filter = new ProfileCompletionFilter(userRepository, objectMapper);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldBlockWhenEmailNotVerified() throws Exception {
        setAuth("customer@test.com", "ROLE_CUSTOMER");

        User user = new User();
        user.setEmail("customer@test.com");
        user.setIsEmailVerified(false);
        user.setIsProfileComplete(true);
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/customer/orders");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(403);
        verify(chain, never()).doFilter(Mockito.any(), Mockito.any());
    }

    @Test
    void shouldBlockWhenProfileIncomplete() throws Exception {
        setAuth("customer@test.com", "ROLE_CUSTOMER");

        User user = new User();
        user.setEmail("customer@test.com");
        user.setIsEmailVerified(true);
        user.setIsProfileComplete(false);
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/customer/orders");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(403);
        verify(chain, never()).doFilter(Mockito.any(), Mockito.any());
    }

    @Test
    void shouldAllowWhitelistedPaths() throws Exception {
        setAuth("customer@test.com", "ROLE_CUSTOMER");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/health");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(Mockito.any(), Mockito.any());
    }

    @Test
    void shouldAllowAdminRegardlessOfProfileStatus() throws Exception {
        setAuth("admin@digitalcafe.com", "ROLE_ADMIN");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/dashboard");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(Mockito.any(), Mockito.any());
    }

    private void setAuth(String email, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, "password", List.of(() -> role))
        );
    }
}
