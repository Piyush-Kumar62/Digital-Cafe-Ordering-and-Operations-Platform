package com.digitalcafe.util;

import com.digitalcafe.config.DevDataInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationStartedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class StartupLogger {

  private static final Logger log =
      LoggerFactory.getLogger(StartupLogger.class);

  private final Optional<DevDataInitializer> devDataInitializer;

  public StartupLogger(Optional<DevDataInitializer> devDataInitializer) {
    this.devDataInitializer = devDataInitializer;
  }

  @EventListener(ApplicationStartedEvent.class)
  public void logStartup() {

    log.info("");
    log.info("=====================================================");
    log.info("               DIGITAL CAFE BACKEND");
    log.info("         Ordering & Operations Platform");
    log.info("=====================================================");
    devDataInitializer.ifPresent(DevDataInitializer::logCredentialsSummary);
    log.info("STATUS   : RUNNING");
    log.info("API      : http://localhost:8080");
    log.info("SWAGGER  : http://localhost:8080/swagger-ui.html");
    log.info("OPENAPI  : http://localhost:8080/v3/api-docs");
    log.info("=====================================================");

  }
}