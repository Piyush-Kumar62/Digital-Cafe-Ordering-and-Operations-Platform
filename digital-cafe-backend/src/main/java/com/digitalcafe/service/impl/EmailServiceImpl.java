package com.digitalcafe.service.impl;

import com.digitalcafe.email.EmailTemplateType;
import com.digitalcafe.service.EmailService;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.time.Year;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.email.from-name:Digital Cafe Team}")
    private String fromName;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${app.email.support-url:http://localhost:4200/contact}")
    private String supportUrl;

    // ── EmailService implementation ──────────────────────────────────────────

    @Async("emailTaskExecutor")
    @Override
    public void sendVerificationEmail(String to, String token, String tempPassword) {
        log.info("[Email] Queuing VERIFY_EMAIL -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("verificationUrl", frontendUrl + "/auth/verify-email?token=" + token);
        vars.put("tempPassword", tempPassword);
        vars.put("hasTempPassword", tempPassword != null && !tempPassword.isBlank());
        internalSend(to, "Verify your Digital Cafe account", EmailTemplateType.VERIFY_EMAIL, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendPasswordResetEmail(String to, String token) {
        log.info("[Email] Queuing RESET_PASSWORD -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("resetUrl", frontendUrl + "/auth/reset-password?token=" + token);
        internalSend(to, "Reset your Digital Cafe password", EmailTemplateType.RESET_PASSWORD, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendPasswordChangedNotification(String to) {
        log.info("[Email] Queuing PASSWORD_CHANGED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("loginUrl", frontendUrl + "/auth/login");
        internalSend(to, "Your Digital Cafe password was changed", EmailTemplateType.PASSWORD_CHANGED, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendApprovalConfirmationEmail(String to) {
        log.info("[Email] Queuing REGISTRATION_APPROVED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("loginUrl", frontendUrl + "/auth/login");
        internalSend(to, "Your Digital Cafe account is approved!", EmailTemplateType.REGISTRATION_APPROVED, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendRejectionEmail(String to) {
        log.info("[Email] Queuing REGISTRATION_REJECTED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        internalSend(to, "Update on your Digital Cafe registration", EmailTemplateType.REGISTRATION_REJECTED, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendWelcomeEmail(String to, String username, String tempPassword) {
        log.info("[Email] Queuing WELCOME -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("email", to);
        vars.put("tempPassword", tempPassword);
        vars.put("loginUrl", frontendUrl + "/auth/login");
        internalSend(to, "Welcome to Digital Cafe, " + username + "!", EmailTemplateType.WELCOME, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendComprehensiveRegistrationSuccess(String to, String username) {
        log.info("[Email] Queuing REGISTRATION_SUCCESS -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("exploreUrl", frontendUrl);
        vars.put("loginUrl", frontendUrl + "/auth/login");
        internalSend(to, "You're all set on Digital Cafe!", EmailTemplateType.REGISTRATION_SUCCESS, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendOrderConfirmation(String to, String orderDetails) {
        log.info("[Email] Queuing ORDER_CONFIRMATION -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("orderDetails", orderDetails);
        vars.put("ordersUrl", frontendUrl + "/customer/orders");
        internalSend(to, "Your Digital Cafe order is confirmed!", EmailTemplateType.ORDER_CONFIRMATION, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendBookingConfirmation(String to, String bookingDetails) {
        log.info("[Email] Queuing BOOKING_CONFIRMATION -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("bookingDetails", bookingDetails);
        vars.put("bookingsUrl", frontendUrl + "/customer/bookings");
        internalSend(to, "Your Digital Cafe table booking is confirmed!", EmailTemplateType.BOOKING_CONFIRMATION, vars);
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private void internalSend(
            String to,
            String subject,
            EmailTemplateType templateType,
            Map<String, Object> variables) {

        try {
            variables.put("currentYear", Year.now().getValue());
            variables.put("frontendUrl", frontendUrl);
            variables.put("supportUrl", supportUrl);
            variables.put("brandName", "Digital Cafe");

            String html = processTemplate(templateType, variables);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, StandardCharsets.UTF_8.name());

            try {
                helper.setFrom(new InternetAddress(fromEmail, fromName));
            } catch (UnsupportedEncodingException e) {
                helper.setFrom(fromEmail);
            }

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText("", html);

            mailSender.send(message);
            log.info("[Email] Sent {} -> {}", templateType, to);

        } catch (Exception e) {
            log.error("[Email] Failed to send {} -> {}: {}", templateType, to, e.getMessage(), e);
        }
    }

    private String processTemplate(EmailTemplateType templateType, Map<String, Object> variables) {
        Context context = new Context(Locale.ENGLISH, variables);
        return templateEngine.process(templateType.getTemplateName(), context);
    }
}
