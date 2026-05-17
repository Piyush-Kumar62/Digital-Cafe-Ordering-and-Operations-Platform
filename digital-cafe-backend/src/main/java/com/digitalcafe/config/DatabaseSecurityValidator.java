package com.digitalcafe.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;

@Slf4j
@Component
public class DatabaseSecurityValidator {

    @Value("${app.database.enforce-postgres-only:true}")
    private boolean enforcePostgresOnly;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.driver-class-name:}")
    private String datasourceDriver;

    private final Environment environment;

    public DatabaseSecurityValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateDatabaseConfiguration() {
        if (!enforcePostgresOnly || isTestProfileActive()) {
            return;
        }

        String normalizedUrl = datasourceUrl == null ? "" : datasourceUrl.toLowerCase();
        String normalizedDriver = datasourceDriver == null ? "" : datasourceDriver.toLowerCase();

        boolean postgresUrl = normalizedUrl.startsWith("jdbc:postgresql:");
        boolean postgresDriver = !StringUtils.hasText(normalizedDriver)
                || normalizedDriver.contains("postgresql");

        if (!postgresUrl || !postgresDriver) {
            throw new IllegalStateException(
                    "PostgreSQL-only policy violation: spring.datasource.url must start with 'jdbc:postgresql:' "
                            + "and driver must be PostgreSQL-compatible."
            );
        }

        log.info("database_policy=POSTGRES_ONLY_ENFORCED datasourceUrl={}", redactUrl(datasourceUrl));
    }

    private boolean isTestProfileActive() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "test".equalsIgnoreCase(profile) || "e2e".equalsIgnoreCase(profile));
    }

    private String redactUrl(String url) {
        if (!StringUtils.hasText(url)) {
            return "<empty>";
        }
        int idx = url.indexOf('?');
        return idx >= 0 ? url.substring(0, idx) + "?..." : url;
    }
}
