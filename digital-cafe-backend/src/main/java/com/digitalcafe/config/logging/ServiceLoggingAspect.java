package com.digitalcafe.config.logging;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Slf4j
@Aspect
@Component
public class ServiceLoggingAspect {

    @Value("${app.logging.service.enabled:true}")
    private boolean enabled;

    @Value("${app.logging.slow-service-ms:750}")
    private long slowServiceThresholdMs;

    @Around("execution(* com.digitalcafe.service..*(..))")
    public Object logServiceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!enabled || !log.isDebugEnabled()) {
            return joinPoint.proceed();
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String method = signature.getDeclaringType().getSimpleName() + "." + signature.getName();
        log.debug("service_start method={} inputs={}", method, summarizeArgs(joinPoint.getArgs()));
        long start = System.nanoTime();
        try {
            Object result = joinPoint.proceed();
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
            if (durationMs >= slowServiceThresholdMs) {
                log.warn("service_slow method={} durationMs={}", method, durationMs);
            }
            log.debug("service_end method={} durationMs={} result={}", method, durationMs, summarizeResult(result));
            return result;
        } catch (Exception ex) {
            long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
            log.error("service_error method={} durationMs={} message={}", method, durationMs, ex.getMessage(), ex);
            throw ex;
        }
    }

    private String summarizeArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return "none";
        }
        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < args.length; i++) {
            Object arg = args[i];
            if (i > 0) {
                summary.append(", ");
            }
            if (arg == null) {
                summary.append("null");
            } else if (arg instanceof CharSequence) {
                summary.append(arg.getClass().getSimpleName()).append("(len=").append(((CharSequence) arg).length()).append(")");
            } else if (arg instanceof java.util.Collection<?> collection) {
                summary.append(arg.getClass().getSimpleName()).append("(size=").append(collection.size()).append(")");
            } else if (arg instanceof java.util.Map<?, ?> map) {
                summary.append(arg.getClass().getSimpleName()).append("(size=").append(map.size()).append(")");
            } else {
                summary.append(arg.getClass().getSimpleName());
            }
        }
        return summary.toString();
    }

    private String summarizeResult(Object result) {
        if (result == null) {
            return "null";
        }
        if (result instanceof CharSequence text) {
            return result.getClass().getSimpleName() + "(len=" + text.length() + ")";
        }
        if (result instanceof java.util.Collection<?> collection) {
            return result.getClass().getSimpleName() + "(size=" + collection.size() + ")";
        }
        if (result instanceof java.util.Map<?, ?> map) {
            return result.getClass().getSimpleName() + "(size=" + map.size() + ")";
        }
        return result.getClass().getSimpleName();
    }
}
