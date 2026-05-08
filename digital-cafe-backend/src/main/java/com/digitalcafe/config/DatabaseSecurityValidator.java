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

    @Value("${app.database.enforce-mysql-only:true}")
    private boolean enforceMySqlOnly;

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
        if (!enforceMySqlOnly || isTestProfileActive()) {
            return;
        }

        String normalizedUrl = datasourceUrl == null ? "" : datasourceUrl.toLowerCase();
        String normalizedDriver = datasourceDriver == null ? "" : datasourceDriver.toLowerCase();

        boolean mysqlUrl = normalizedUrl.startsWith("jdbc:mysql:");
        boolean mysqlDriver = !StringUtils.hasText(normalizedDriver)
                || normalizedDriver.contains("mysql");

        if (!mysqlUrl || !mysqlDriver) {
            throw new IllegalStateException(
                    "MySQL-only policy violation: spring.datasource.url must start with 'jdbc:mysql:' "
                            + "and driver must be MySQL-compatible."
            );
        }

        log.info("database_policy=MYSQL_ONLY_ENFORCED datasourceUrl={}", redactUrl(datasourceUrl));
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
