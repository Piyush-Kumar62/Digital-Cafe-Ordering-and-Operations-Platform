package com.digitalcafe.security;

import com.digitalcafe.entity.User;
import com.digitalcafe.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Centralized profile completion and email verification guard.
 *
 * Design: enforcing these checks in a single filter (rather than in every controller)
 * eliminates code duplication and ensures no endpoint can be accidentally reached
 * by an unverified or incomplete non-admin profile.
 *
 * Applies to all authenticated non-admin roles.
 * Paths listed in WHITELIST are always permitted regardless of profile state.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProfileCompletionFilter extends OncePerRequestFilter {

    private static final Set<String> WHITELIST_PREFIXES = Set.of(
            "/api/auth",
            "/api/profile",
            "/api/users/me",
            "/api/users/profile",
            "/api/public",
            "/swagger-ui",
            "/v3/api-docs",
            "/actuator",
            "/ws",
            "/uploads"
    );

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (isWhitelisted(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || isSystemAdmin(auth)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            filterChain.doFilter(request, response);
            return;
        }

        if (!Boolean.TRUE.equals(user.getIsEmailVerified())) {
            log.warn("Blocked unverified non-admin user: email={}, uri={}", email, request.getRequestURI());
            writeError(response, HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED",
                    "Please verify your email before accessing this resource.");
            return;
        }

        if (!Boolean.TRUE.equals(user.getIsProfileComplete())) {
            log.warn("Blocked incomplete-profile non-admin user: email={}, uri={}", email, request.getRequestURI());
            writeError(response, HttpStatus.FORBIDDEN, "PROFILE_INCOMPLETE",
                    "Please complete your profile before accessing this resource.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isWhitelisted(String uri) {
        return WHITELIST_PREFIXES.stream().anyMatch(uri::startsWith);
    }

    private boolean isSystemAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private void writeError(HttpServletResponse response, HttpStatus status,
                            String code, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                "status", status.value(),
                "error", code,
                "message", message
        )));
    }
}
