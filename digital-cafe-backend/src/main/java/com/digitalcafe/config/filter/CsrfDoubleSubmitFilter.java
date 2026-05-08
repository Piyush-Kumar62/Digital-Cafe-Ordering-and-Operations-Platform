package com.digitalcafe.config.filter;

import com.digitalcafe.security.CookieUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Slf4j
@Component
public class CsrfDoubleSubmitFilter extends OncePerRequestFilter {

    private static final Set<String> UNSAFE_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    @Value("${app.csrf.enabled:true}")
    private boolean csrfEnabled;

    @Value("${app.csrf.header-name:X-XSRF-TOKEN}")
    private String csrfHeaderName;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!csrfEnabled || isSafe(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String csrfCookie = readCookieValue(request, CookieUtil.CSRF_TOKEN_COOKIE);
        String csrfHeader = request.getHeader(csrfHeaderName);
        if (!StringUtils.hasText(csrfHeader)) {
            csrfHeader = request.getHeader("X-CSRF-Token");
        }

        if (StringUtils.hasText(csrfCookie) && csrfCookie.equals(csrfHeader)) {
            filterChain.doFilter(request, response);
            return;
        }

        log.warn("security_error=CSRF_BLOCKED method={} path={} clientIp={}",
                request.getMethod(), request.getRequestURI(), resolveClientIp(request));
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"CSRF token is missing or invalid\"}"
        );
    }

    private boolean isSafe(HttpServletRequest request) {
        String method = request.getMethod();
        if (!UNSAFE_METHODS.contains(method)) {
            return true;
        }

        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            return true;
        }

        if (hasBearerAuth(request)) {
            // Bearer-token auth is not CSRF-prone in the browser double-submit model.
            return true;
        }

        return path.startsWith("/api/public/")
                || path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/register")
                || path.startsWith("/api/auth/simple-register")
                || path.startsWith("/api/auth/register/cafe-owner")
                || path.startsWith("/api/auth/verify-email")
                || path.startsWith("/api/auth/resend-verification")
                || path.startsWith("/api/auth/forgot-password")
                || path.startsWith("/api/auth/reset-password")
                || path.startsWith("/api/auth/refresh-token")
                || path.startsWith("/api/auth/logout")
                || path.startsWith("/api/payments/webhook")
                || path.startsWith("/api/v1/payments/webhook")
                || path.startsWith("/actuator")
                || path.startsWith("/ws");
    }

    private boolean hasBearerAuth(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        return StringUtils.hasText(authorization) && authorization.startsWith("Bearer ");
    }

    private String readCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("CF-Connecting-IP");
        if (!StringUtils.hasText(ip)) {
            ip = request.getHeader("X-Forwarded-For");
        }
        if (!StringUtils.hasText(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}

