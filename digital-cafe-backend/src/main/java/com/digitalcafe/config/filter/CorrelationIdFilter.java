package com.digitalcafe.config.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.digitalcafe.util.RequestIdGenerator;

import java.io.IOException;

@Slf4j
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    public static final String REQUEST_ID_HEADER = "X-Request-Id";
    public static final String MDC_KEY = "correlationId";
    public static final String MDC_REQUEST_ID_KEY = "requestId";
    public static final String MDC_USER_ID_KEY = "userId";
    public static final String MDC_USERNAME_KEY = "username";
    private static final String[] NOISY_PREFIXES = {"/ws", "/actuator/health", "/actuator/prometheus"};

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String correlationId = extractCorrelationId(request);
        String requestId = StringUtils.hasText(correlationId) ? correlationId : RequestIdGenerator.newShortId();

        if (StringUtils.hasText(correlationId)) {
            MDC.put(MDC_KEY, correlationId);
            response.setHeader(CORRELATION_ID_HEADER, correlationId);
        } else {
            MDC.remove(MDC_KEY);
        }
        MDC.put(MDC_REQUEST_ID_KEY, requestId);
        MDC.put(MDC_USER_ID_KEY, "anonymous");
        MDC.put(MDC_USERNAME_KEY, "anonymous");
        response.setHeader(REQUEST_ID_HEADER, requestId);
        if (log.isDebugEnabled() && !isNoisyPath(request.getRequestURI())) {
            log.debug("request_id_assigned path={} requestId={} correlationId={}",
                    request.getRequestURI(), requestId, correlationId);
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
            MDC.remove(MDC_REQUEST_ID_KEY);
            MDC.remove(MDC_USER_ID_KEY);
            MDC.remove(MDC_USERNAME_KEY);
        }
    }

    private String extractCorrelationId(HttpServletRequest request) {
        String header = request.getHeader(CORRELATION_ID_HEADER);
        if (StringUtils.hasText(header)) {
            return header;
        }
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (StringUtils.hasText(requestId)) {
            return requestId;
        }
        return null;
    }

    private boolean isNoisyPath(String path) {
        if (!StringUtils.hasText(path)) {
            return false;
        }
        for (String prefix : NOISY_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }
}
