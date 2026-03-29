package com.digitalcafe.controller;

import com.digitalcafe.dto.request.LoginRequest;
import com.digitalcafe.dto.response.AuthResponse;
import com.digitalcafe.security.JwtAuthenticationFilter;
import com.digitalcafe.security.JwtUtil;
import com.digitalcafe.security.ProfileCompletionFilter;
import com.digitalcafe.security.CookieUtil;
import com.digitalcafe.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CookieUtil cookieUtil;

    @MockitoBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private ProfileCompletionFilter profileCompletionFilter;

    @Test
    void loginShouldSetRefreshCookieWhenProvided() throws Exception {
        AuthResponse response = AuthResponse.builder()
                .token("access-token")
                .refreshToken("refresh-token")
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, "refreshToken=refresh-token; Path=/; HttpOnly");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);
        when(cookieUtil.createRefreshTokenCookie(anyString())).thenReturn(headers);

        LoginRequest request = new LoginRequest();
        request.setEmail("customer@test.com");
        request.setPassword("Password@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, "refreshToken=refresh-token; Path=/; HttpOnly"))
                .andExpect(jsonPath("$.token").value("access-token"));
    }

    @Test
    void verifyEmailShouldReturnSuccessMessage() throws Exception {
        doNothing().when(authService).verifyEmail(anyString());

        mockMvc.perform(get("/api/auth/verify-email")
                        .param("token", "token-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verified successfully"));
    }

    @Test
    void logoutShouldClearRefreshCookie() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, "refreshToken=; Path=/; Max-Age=0; HttpOnly");
        when(cookieUtil.clearRefreshTokenCookie()).thenReturn(headers);

        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("refreshToken=; Path=/; Max-Age=0")))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }
}

