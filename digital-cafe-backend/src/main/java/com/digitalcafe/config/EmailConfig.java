package com.digitalcafe.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.nio.charset.StandardCharsets;

/**
 * Thymeleaf configuration for email template rendering.
 *
 * <p>Intentionally isolated from Spring MVC's view resolver — this engine
 * is used exclusively for building email HTML bodies.</p>
 *
 * <p>Templates are located at {@code classpath:/templates/email/}
 * and referenced by their file name without the {@code .html} suffix.</p>
 *
 * <p>Example usage in service layer:</p>
 * <pre>
 *   Context ctx = new Context(Locale.ENGLISH, variables);
 *   String html = emailTemplateEngine.process("verify-email", ctx);
 * </pre>
 */
@Configuration
public class EmailConfig {

    @Bean(name = "emailTemplateEngine")
    public SpringTemplateEngine emailTemplateEngine() {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.addTemplateResolver(emailTemplateResolver());
        return engine;
    }

    private ClassLoaderTemplateResolver emailTemplateResolver() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        // All email templates live under classpath:/templates/email/
        resolver.setPrefix("templates/email/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding(StandardCharsets.UTF_8.name());
        resolver.setCacheable(true);         // enable caching in deployment
        resolver.setCacheTTLMs(3_600_000L); // re-read template every 1 hour
        resolver.setOrder(1);
        resolver.setCheckExistence(false);
        return resolver;
    }
}
