package com.digitalcafe.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.retry.backoff.ExponentialBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class EmailRetryConfig {

    @Value("${app.email.retry.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.email.retry.initial-delay-ms:1000}")
    private long initialDelayMs;

    @Value("${app.email.retry.max-delay-ms:10000}")
    private long maxDelayMs;

    @Value("${app.email.retry.multiplier:2.0}")
    private double multiplier;

    @Bean(name = "emailRetryTemplate")
    public RetryTemplate emailRetryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();

        Map<Class<? extends Throwable>, Boolean> retryable = new HashMap<>();
        retryable.put(MailException.class, true);
        retryable.put(MailSendException.class, true);
        retryable.put(MailAuthenticationException.class, true);

        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy(maxAttempts, retryable, true);
        retryTemplate.setRetryPolicy(retryPolicy);

        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(initialDelayMs);
        backOffPolicy.setMaxInterval(maxDelayMs);
        backOffPolicy.setMultiplier(multiplier);
        retryTemplate.setBackOffPolicy(backOffPolicy);

        return retryTemplate;
    }
}
