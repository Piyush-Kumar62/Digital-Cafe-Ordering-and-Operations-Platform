package com.digitalcafe.config;

import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Component
public class StartupDatabaseLogger {

    private final DataSource dataSource;
    private final AtomicBoolean loggedOnce = new AtomicBoolean(false);

    @Value("${app.logging.sensitive.enabled:false}")
    private boolean sensitiveLoggingEnabled;

    public StartupDatabaseLogger(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void logDatabaseInfoAtInit() {
        logDatabaseInfoOnce("init");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logDatabaseInfo() {
        logDatabaseInfoOnce("ready");
    }

    private void logDatabaseInfoOnce(String phase) {
        if (!loggedOnce.compareAndSet(false, true)) {
            return;
        }

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData meta = connection.getMetaData();
            if (sensitiveLoggingEnabled) {
                log.info("[DB CONNECTED] phase={} url={} user={} db={} driver={} version={}",
                        phase,
                        meta.getURL(),
                        meta.getUserName(),
                        meta.getDatabaseProductName(),
                        meta.getDriverName(),
                        meta.getDatabaseProductVersion());
            } else {
                log.info("[DB CONNECTED] phase={} db={} driver={} version={}",
                        phase,
                        meta.getDatabaseProductName(),
                        meta.getDriverName(),
                        meta.getDatabaseProductVersion());
            }
        } catch (Exception ex) {
            log.warn("[DB CONNECTION FAILED] phase={} message={}", phase, ex.getMessage());
        }
    }
}
