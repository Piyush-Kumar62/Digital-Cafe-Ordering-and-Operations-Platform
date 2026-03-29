package com.digitalcafe.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

@Slf4j
@Component
public class StartupDatabaseLogger {

    private final DataSource dataSource;

    public StartupDatabaseLogger(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logDatabaseInfo() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData meta = connection.getMetaData();
            log.info("db_connected url={} driver={} db={} version={}",
                    meta.getURL(), meta.getDriverName(), meta.getDatabaseProductName(), meta.getDatabaseProductVersion());
        } catch (Exception ex) {
            log.warn("db_connection_check_failed message={}", ex.getMessage());
        }
    }
}
