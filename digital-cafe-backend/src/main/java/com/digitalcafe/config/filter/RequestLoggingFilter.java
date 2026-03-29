package com.digitalcafe.config.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final String[] SENSITIVE_KEYS = {"password", "token", "authorization", "secret"};

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long start = System.nanoTime();
        String method = request.getMethod();
        String path = request.getRequestURI();
        String clientIp = resolveClientIp(request);
        if (log.isDebugEnabled()) {
            log.debug("request_started method={} path={} queryParams={} clientIp={}",
                    method, path, sanitizeParams(request.getQueryString()), clientIp);
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
            int status = response.getStatus();
            String userId = resolveUserId();
            if (status >= 500) {
                log.error("request_completed method={} path={} status={} durationMs={} clientIp={} userId={}",
                        method, path, status, durationMs, clientIp, userId);
            } else if (status >= 400) {
                log.warn("request_completed method={} path={} status={} durationMs={} clientIp={} userId={}",
                        method, path, status, durationMs, clientIp, userId);
            } else {
                log.info("request_completed method={} path={} status={} durationMs={} clientIp={} userId={}",
                        method, path, status, durationMs, clientIp, userId);
            }
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("CF-Connecting-IP");
        if (ip == null || ip.isBlank()) {
            ip = request.getHeader("X-Forwarded-For");
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    private String resolveUserId() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "anonymous";
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof com.digitalcafe.security.CustomUserPrincipal customUser) {
            return String.valueOf(customUser.getId());
        }
        return "unknown";
    }

    private Map<String, String> sanitizeParams(String queryString) {
        Map<String, String> params = new LinkedHashMap<>();
        if (queryString == null || queryString.isBlank()) {
            return params;
        }
        String[] pairs = queryString.split("&");
        for (String pair : pairs) {
            if (pair.isBlank()) {
                continue;
            }
            String[] kv = pair.split("=", 2);
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String value = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            if (isSensitiveKey(key)) {
                params.put(key, "***");
            } else {
                params.put(key, value);
            }
        }
        return params;
    }

    private boolean isSensitiveKey(String key) {
        String lowered = key.toLowerCase(Locale.ROOT);
        return Arrays.stream(SENSITIVE_KEYS).anyMatch(lowered::contains);
    }
}
