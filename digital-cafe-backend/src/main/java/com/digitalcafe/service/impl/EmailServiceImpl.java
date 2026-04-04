package com.digitalcafe.service.impl;

import com.digitalcafe.email.EmailTemplateType;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.util.PaymentReceiptPdfGenerator;
import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final UserRepository userRepository;

    public EmailServiceImpl(JavaMailSender mailSender,
                            @Qualifier("emailTemplateEngine") SpringTemplateEngine templateEngine,
                            UserRepository userRepository) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.userRepository = userRepository;
    }

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    /** The address that appears in the email "From:" header. Must be a real email address. */
    @Value("${MAIL_FROM_EMAIL:noreply@digitalcafe.com}")
    private String fromEmail;

    @Value("${MAIL_ENABLED:true}")
    private boolean emailEnabled;

    @Value("${MAIL_SKIP_ADMIN:false}")
    private boolean skipAdminRecipients;

    @Value("${EMAIL_FROM_NAME:Digital Cafe Team}")
    private String fromName;

    @Value("${FRONTEND_URL:http://localhost:4200}")
    private String frontendUrl;

    @Value("${EMAIL_SUPPORT_URL:http://localhost:4200/contact}")
    private String supportUrl;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${spring.mail.port:587}")
    private int smtpPort;

    @PostConstruct
    public void logEmailConfig() {
        if (!emailEnabled) {
            log.warn("[Email] ⚠️  Service is DISABLED (MAIL_ENABLED=false). No emails will be sent.");
            return;
        }
        if ((fromEmail == null || fromEmail.isBlank()) && smtpUsername != null && !smtpUsername.isBlank()) {
            fromEmail = smtpUsername;
            log.warn("[Email] MAIL_FROM_EMAIL is empty; defaulting from-email to spring.mail.username={}", smtpUsername);
        }
        if (smtpUsername == null || smtpUsername.isBlank() || smtpPassword == null || smtpPassword.isBlank()) {
            log.warn("[Email] ⚠️  SMTP credentials NOT configured! Set MAIL_USERNAME + MAIL_PASSWORD in .env. ALL emails will be skipped.");
        } else {
            log.info("[Email] ✅ Ready — from=\"{}\" <{}>, smtp={}:{}, username={}",
                    fromName, fromEmail, smtpHost, smtpPort, smtpUsername);
        }

        // Warn if any email template is missing from the classpath
        for (EmailTemplateType type : EmailTemplateType.values()) {
            String path = "templates/email/" + type.getTemplateName() + ".html";
            if (!new ClassPathResource(path).exists()) {
                log.warn("[Email] ⚠️  Missing template: {} (for {})", path, type);
            }
        }
    }

    // EmailService implementation
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
    public void sendAccountActivated(String to, String username, String role) {
        log.info("[Email] Queuing ACCOUNT_ACTIVATED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("role", role);
        vars.put("loginUrl", frontendUrl + "/auth/login");
        internalSend(to, "Your Digital Cafe account is now active", EmailTemplateType.ACCOUNT_ACTIVATED, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendAccountDeactivated(String to, String username, String role) {
        log.info("[Email] Queuing ACCOUNT_DEACTIVATED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("role", role);
        vars.put("supportUrl", supportUrl);
        internalSend(to, "Your Digital Cafe account has been deactivated", EmailTemplateType.ACCOUNT_DEACTIVATED, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendAccountReactivated(String to, String username, String role) {
        log.info("[Email] Queuing ACCOUNT_REACTIVATED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("role", role);
        vars.put("loginUrl", frontendUrl + "/auth/login");
        internalSend(to, "Your Digital Cafe account has been reactivated", EmailTemplateType.ACCOUNT_REACTIVATED, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendApprovalConfirmationEmail(String to, String username, String role) {
        log.info("[Email] Queuing REGISTRATION_APPROVED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("role", role);
        vars.put("loginUrl", frontendUrl + "/auth/login");
        vars.put("dashboardUrl", frontendUrl + resolveDashboardPath(role));
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
    public void sendWelcomeEmail(String to, String username, String tempPassword, String role, String dashboardUrl) {
        log.info("[Email] Queuing WELCOME -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("email", to);
        vars.put("tempPassword", tempPassword);
        vars.put("role", role);
        vars.put("loginUrl", frontendUrl + "/auth/login");
        vars.put("dashboardUrl", !dashboardUrl.startsWith("http") ? (frontendUrl + dashboardUrl) : dashboardUrl);
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
    public void sendPaymentReceipt(String to, String username, String receiptNumber, String paymentDetails) {
        log.info("[Email] Queuing PAYMENT_RECEIPT -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("receiptNumber", receiptNumber);
        vars.put("paymentDetails", paymentDetails);
        vars.put("paymentsUrl", frontendUrl + "/customer/payments");
        vars.put("ordersUrl", frontendUrl + "/customer/orders");

        try {
            byte[] pdfBytes = PaymentReceiptPdfGenerator.generate(receiptNumber, username, paymentDetails);
            EmailAttachment receiptAttachment = new EmailAttachment(
                    "payment-receipt-" + receiptNumber + ".pdf",
                    "application/pdf",
                    pdfBytes
            );
            internalSend(
                    to,
                    "Payment Receipt - " + receiptNumber,
                    EmailTemplateType.PAYMENT_RECEIPT,
                    vars,
                    List.of(receiptAttachment)
            );
        } catch (Exception ex) {
            log.warn("[Email] Failed to generate PDF receipt for {}: {}", to, ex.getMessage());
            internalSend(to, "Payment Receipt - " + receiptNumber, EmailTemplateType.PAYMENT_RECEIPT, vars);
        }
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendLoginNotification(String to, String username, String loginTime) {
        log.info("[Email] Queuing LOGIN_NOTIFICATION -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("username", username);
        vars.put("loginTime", loginTime);
        vars.put("loginUrl", frontendUrl + "/auth/login");
        vars.put("supportUrl", supportUrl);
        internalSend(to, "New login to your Digital Cafe account", EmailTemplateType.LOGIN_NOTIFICATION, vars);
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

    @Async("emailTaskExecutor")
    @Override
    public void sendOrderReadyNotification(String to, String orderNumber) {
        log.info("[Email] Queuing ORDER_READY -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("orderNumber", orderNumber);
        vars.put("ordersUrl", frontendUrl + "/customer/orders");
        internalSend(to, "Your Digital Cafe order is ready! — " + orderNumber, EmailTemplateType.ORDER_READY, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendOrderServedNotification(String to, String orderNumber) {
        log.info("[Email] Queuing ORDER_SERVED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("orderNumber", orderNumber);
        vars.put("ordersUrl", frontendUrl + "/customer/orders");
        internalSend(to, "Your Digital Cafe order has been served — " + orderNumber, EmailTemplateType.ORDER_SERVED, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendOrderCancelledNotification(String to, String orderNumber) {
        log.info("[Email] Queuing ORDER_CANCELLED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("orderNumber", orderNumber);
        vars.put("ordersUrl", frontendUrl + "/customer/orders");
        internalSend(to, "Your Digital Cafe order has been cancelled — " + orderNumber, EmailTemplateType.ORDER_CANCELLED, vars);
    }

    @Async("emailTaskExecutor")
    @Override
    public void sendBookingCancelledEmail(String to, String bookingDetails) {
        log.info("[Email] Queuing BOOKING_CANCELLED -> {}", to);
        Map<String, Object> vars = new HashMap<>();
        vars.put("bookingDetails", bookingDetails);
        vars.put("bookingsUrl", frontendUrl + "/customer/bookings");
        internalSend(to, "Your Digital Cafe booking has been cancelled", EmailTemplateType.BOOKING_CANCELLED, vars);
    }

    // Internal helpers
    private void internalSend(
            String to,
            String subject,
            EmailTemplateType templateType,
            Map<String, Object> variables) {
        internalSend(to, subject, templateType, variables, List.of());
    }

    private void internalSend(
            String to,
            String subject,
            EmailTemplateType templateType,
            Map<String, Object> variables,
            List<EmailAttachment> attachments) {

        if (skipAdminRecipients && isAdminRecipient(to)) {
            log.info("[Email] SKIP (admin recipient) {} -> {}", templateType, to);
            return;
        }

        // Guard: skip silently if not configured rather than throwing a cryptic SMTP auth error
        if (!emailEnabled) {
            log.debug("[Email] SKIP (disabled) {} -> {}", templateType, to);
            return;
        }
        if (smtpUsername.isBlank() || smtpPassword.isBlank()) {
            log.warn("[Email] SKIP (no credentials) {} -> {} | Set MAIL_USERNAME + MAIL_PASSWORD in .env", templateType, to);
            return;
        }

        try {
            variables.put("currentYear", Year.now().getValue());
            variables.put("frontendUrl", frontendUrl);
            variables.put("supportUrl", supportUrl);
            variables.put("brandName", "Digital Cafe");
            if (!variables.containsKey("username") || isBlank(String.valueOf(variables.get("username")))) {
                variables.put("username", resolveDisplayName(to));
            }
            if (!variables.containsKey("lastLogin")) {
                variables.put("lastLogin", resolveLastLogin(to));
            }

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
            helper.setReplyTo(fromEmail);
            helper.setSubject(subject);
            helper.setText(toPlainText(html), html);
            for (EmailAttachment attachment : attachments) {
                helper.addAttachment(
                        attachment.fileName(),
                        new ByteArrayResource(attachment.content()),
                        attachment.contentType()
                );
            }

            mailSender.send(message);
            log.info("[Email] ✅ Sent {} -> {}", templateType, to);

        } catch (Exception e) {
            Throwable cause = e.getCause();
            log.error("[Email] ❌ FAILED {} -> {} | Error: {} | Root cause: {}",
                    templateType, to, e.getMessage(),
                    cause != null ? cause.getClass().getSimpleName() + ": " + cause.getMessage() : "none");
            log.debug("[Email] Full SMTP exception stack:", e);
        }
    }

    private String resolveDisplayName(String email) {
        if (email == null || email.isBlank()) {
            return "there";
        }
        return userRepository.findByEmail(email)
                .map(this::buildDisplayName)
                .filter(name -> !name.isBlank())
                .orElse(normalizeIdentity(email));
    }

    private boolean isAdminRecipient(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return userRepository.findByEmail(email)
                .map(User::getRoles)
                .map(roles -> roles.stream()
                        .map(Role::getName)
                        .anyMatch(roleName -> roleName == Role.RoleName.ADMIN))
                .orElse(false);
    }

    private String buildDisplayName(User user) {
        if (user == null) return "there";
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName().trim();
        }
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String full = (first + " " + last).trim();
        if (!full.isBlank()) {
            return full;
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return normalizeIdentity(user.getUsername().trim());
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return normalizeIdentity(user.getEmail().trim());
        }
        return "there";
    }

    private String normalizeIdentity(String identity) {
        if (identity == null || identity.isBlank()) {
            return "there";
        }
        String value = identity.trim();
        if (value.contains("@")) {
            value = value.substring(0, value.indexOf('@'));
        }
        value = value.replaceAll("[._-]+", " ").trim();
        if (value.isBlank()) {
            return "there";
        }

        String[] parts = value.split("\\s+");
        StringBuilder friendly = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            if (!friendly.isEmpty()) {
                friendly.append(' ');
            }
            if (part.length() == 1) {
                friendly.append(part.toUpperCase(Locale.ENGLISH));
            } else {
                friendly.append(Character.toUpperCase(part.charAt(0)))
                        .append(part.substring(1));
            }
        }

        String result = friendly.toString().trim();
        return result.isBlank() ? "there" : result;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String resolveLastLogin(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return userRepository.findByEmail(email)
                .map(User::getLastLogin)
                .map(lastLogin -> DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z")
                        .format(lastLogin.atZone(ZoneId.systemDefault())))
                .orElse(null);
    }

    private String processTemplate(EmailTemplateType templateType, Map<String, Object> variables) {
        Context context = new Context(Locale.ENGLISH, variables);
        try {
            return templateEngine.process(templateType.getTemplateName(), context);
        } catch (Exception ex) {
            // Fallback for template path mismatches or missing resources
            try {
                return templateEngine.process("email/" + templateType.getTemplateName(), context);
            } catch (Exception ignored) {
                log.warn("[Email] Template missing for {}. Sending fallback content.", templateType);
                return buildFallbackEmail(templateType, variables);
            }
        }
    }

    private String buildFallbackEmail(EmailTemplateType templateType, Map<String, Object> variables) {
        String username = String.valueOf(variables.getOrDefault("username", "there"));
        String loginUrl = String.valueOf(variables.getOrDefault("loginUrl", frontendUrl + "/auth/login"));
        String support = String.valueOf(variables.getOrDefault("supportUrl", supportUrl));
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <title>Digital Cafe Notification</title>
                </head>
                <body style="font-family: Arial, sans-serif; color:#1f2937;">
                  <h2 style="margin:0 0 8px 0;">Hello %s,</h2>
                  <p>We couldn’t load the full email template for %s, but here’s the important info.</p>
                  <p>You can log in here: <a href="%s">%s</a></p>
                  <p>If you need help, contact us: <a href="%s">%s</a></p>
                  <p style="margin-top:16px;">— Digital Cafe Team</p>
                </body>
                </html>
                """.formatted(username, templateType.name(), loginUrl, loginUrl, support, support);
    }

    /** Strips HTML tags and entities to produce a plain-text fallback body for multipart emails. */
    private static String toPlainText(String html) {
        return html
                .replaceAll("(?si)<style[^>]*>.*?</style>", " ")
                .replaceAll("(?si)<script[^>]*>.*?</script>", " ")
                .replaceAll("<[^>]+>", " ")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&quot;", "\"")
                .replaceAll("&#39;", "'")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }

    private record EmailAttachment(String fileName, String contentType, byte[] content) {
    }

    /**
     * Maps a raw role name (e.g. "CHEF", "cafe_owner") to the
     * corresponding frontend dashboard path.
     */
    private String resolveDashboardPath(String role) {
        if (role == null) return "/auth/login";
        return switch (role.toUpperCase().replace(" ", "_").replace("-", "_")) {
            case "ADMIN"      -> "/admin/dashboard";
            case "CAFE_OWNER" -> "/owner/dashboard";
            case "CHEF"       -> "/chef/dashboard";
            case "WAITER"     -> "/waiter/dashboard";
            case "CUSTOMER"   -> "/cafes";
            default           -> "/auth/login";
        };
    }
}
