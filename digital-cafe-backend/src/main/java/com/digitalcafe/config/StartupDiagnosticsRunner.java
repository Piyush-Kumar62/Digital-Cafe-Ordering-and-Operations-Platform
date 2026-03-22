package com.digitalcafe.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.core.annotation.Order;
import jakarta.annotation.PostConstruct;

import java.util.Arrays;

/**
 * Lightweight startup diagnostics for dev profile.
 * Helps confirm key flags and env imports are actually active.
 */
@Slf4j
@Configuration
@Profile("dev")
@RequiredArgsConstructor
public class StartupDiagnosticsRunner {

    private final Environment environment;

    @PostConstruct
    public void logOnInit() {
        String[] profiles = environment.getActiveProfiles();
        System.out.println("[Startup] (post-construct) Active profiles: " +
                (profiles.length == 0 ? "default" : Arrays.toString(profiles)));
        System.out.println("[Startup] (post-construct) app.dev.seed.enabled=" +
                environment.getProperty("app.dev.seed.enabled"));
        System.out.println("[Startup] (post-construct) app.data.init.enabled=" +
                environment.getProperty("app.data.init.enabled"));
    }

    @Bean
    @Order(0)
    public ApplicationRunner logStartupDiagnostics() {
        return args -> {
            String[] profiles = environment.getActiveProfiles();
            log.info("[Startup] Active profiles: {}", profiles.length == 0 ? "default" : Arrays.toString(profiles));
            log.info("[Startup] app.dev.seed.enabled={}", environment.getProperty("app.dev.seed.enabled"));
            log.info("[Startup] app.data.init.enabled={}", environment.getProperty("app.data.init.enabled"));
        };
    }
}
