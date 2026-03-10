package com.digitalcafe.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class StartupLogger {

  private static final Logger log =
      LoggerFactory.getLogger(StartupLogger.class);

  @EventListener(ApplicationReadyEvent.class)
  public void logStartup() {

    log.info("");
    log.info("=====================================================");
    log.info("               DIGITAL CAFE BACKEND");
    log.info("         Ordering & Operations Platform");
    log.info("=====================================================");
    log.info("STATUS   : RUNNING");
    log.info("API      : http://localhost:8080");
    log.info("SWAGGER  : http://localhost:8080/swagger-ui.html");
    log.info("OPENAPI  : http://localhost:8080/v3/api-docs");
    log.info("=====================================================");
    log.info("");

  }
}