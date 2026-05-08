package com.digitalcafe.config.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Value("${app.security.headers.enabled:true}")
    private boolean enabled;

    @Value("${app.security.headers.content-security-policy:default-src 'self'; base-uri 'self'; frame-ancestors 'self'; object-src 'none'}")
    private String contentSecurityPolicy;

    @Value("${app.security.headers.referrer-policy:strict-origin-when-cross-origin}")
    private String referrerPolicy;

    @Value("${app.security.headers.permissions-policy:geolocation=(), camera=(), microphone=()}")
    private String permissionsPolicy;

    @Value("${app.security.headers.hsts-max-age:31536000}")
    private long hstsMaxAge;

    @Value("${app.security.headers.hsts-include-subdomains:true}")
    private boolean hstsIncludeSubdomains;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        filterChain.doFilter(request, response);
        if (!enabled) {
            return;
        }

        if (!response.containsHeader("X-Content-Type-Options")) {
            response.setHeader("X-Content-Type-Options", "nosniff");
        }
        if (!response.containsHeader("X-Frame-Options")) {
            response.setHeader("X-Frame-Options", "SAMEORIGIN");
        }
        if (!response.containsHeader("Referrer-Policy")) {
            response.setHeader("Referrer-Policy", referrerPolicy);
        }
        if (!response.containsHeader("Permissions-Policy")) {
            response.setHeader("Permissions-Policy", permissionsPolicy);
        }
        if (!response.containsHeader("Content-Security-Policy")) {
            response.setHeader("Content-Security-Policy", contentSecurityPolicy);
        }

        if (request.isSecure() && !response.containsHeader("Strict-Transport-Security")) {
            String hsts = "max-age=" + Math.max(hstsMaxAge, 0);
            if (hstsIncludeSubdomains) {
                hsts += "; includeSubDomains";
            }
            response.setHeader("Strict-Transport-Security", hsts);
        }
    }
}
