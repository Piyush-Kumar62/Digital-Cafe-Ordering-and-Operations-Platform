package com.digitalcafe.config.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limit.capacity:120}")
    private int capacity;

    @Value("${app.rate-limit.refill-per-minute:120}")
    private int refillPerMinute;

    @Value("${app.rate-limit.auth.enabled:true}")
    private boolean authLimitEnabled;

    @Value("${app.rate-limit.auth.capacity:20}")
    private int authCapacity;

    @Value("${app.rate-limit.auth.refill-per-minute:20}")
    private int authRefillPerMinute;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        if (isAuthSensitivePath(request) && authLimitEnabled) {
            String authKey = resolveClientKey(request) + ":" + request.getRequestURI();
            Bucket authBucket = authBuckets.computeIfAbsent(authKey, k -> newAuthBucket());
            if (tryConsumeOrReject(authBucket, authKey, request, response)) {
                filterChain.doFilter(request, response);
            }
            return;
        }

        if (isExcluded(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveClientKey(request);
        Bucket bucket = buckets.computeIfAbsent(key, k -> newBucket());
        if (tryConsumeOrReject(bucket, key, request, response)) {
            filterChain.doFilter(request, response);
        }
    }

    private Bucket newBucket() {
        Refill refill = Refill.greedy(refillPerMinute, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(capacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket newAuthBucket() {
        Refill refill = Refill.greedy(authRefillPerMinute, Duration.ofMinutes(1));
        Bandwidth limit = Bandwidth.classic(authCapacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    private boolean tryConsumeOrReject(Bucket bucket, String key, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        if (bucket.tryConsume(1)) {
            return true;
        }
        log.warn("rate_limit_exceeded key={} method={} path={}", key, request.getMethod(), request.getRequestURI());
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded\"}");
        return false;
    }

    private boolean isExcluded(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator")
                || path.startsWith("/api/public/health")
                || path.startsWith("/api/public/ping")
                || path.startsWith("/api/payments/webhook")
                || path.startsWith("/api/v1/payments/webhook")
                || path.startsWith("/ws");
    }

    private boolean isAuthSensitivePath(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/forgot-password")
                || path.startsWith("/api/auth/resend-verification");
    }

    private String resolveClientKey(HttpServletRequest request) {
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
