package com.digitalcafe.service.impl;

import com.digitalcafe.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendVerificationEmail(String to, String token, String tempPassword) {
        String subject = "Digital Cafe - Verify Your Email";
        String verificationUrl = frontendUrl + "/auth/verify-email?token=" + token;
        String roleBlock = """
                <div class="dc-card">
                    <p class="dc-label">Account Access</p>
                    <p class="dc-value">New user setup is in progress. Please verify your email to activate role-based access.</p>
                </div>
                """;

        String tempPasswordBlock = "";
        if (tempPassword != null) {
            tempPasswordBlock = """
                    <div class="dc-card">
                        <p class="dc-label">Temporary Password</p>
                        <p class="dc-code">%s</p>
                        <p class="dc-note">You will be required to change this password on first login.</p>
                    </div>
                    """.formatted(escapeHtml(tempPassword));
        }

        String content = """
                <p class="dc-text">Welcome to <strong>Digital Cafe</strong>. Please verify your email to secure your account and start using customer and staff features.</p>
                %s
                %s
                <div class="dc-card">
                    <p class="dc-label">Link Expiry</p>
                    <p class="dc-value">This verification link expires in <strong>24 hours</strong>.</p>
                </div>
                """.formatted(roleBlock, tempPasswordBlock);

        String html = buildEmailTemplate(
                "Verify Your Email",
                "Activate your Digital Cafe account",
                content,
                "Verify Email",
                verificationUrl,
                "If you did not create this account, you can safely ignore this email."
        );

        String text = "Welcome to Digital Cafe!\n\n"
                + "Please verify your email by clicking the link below:\n"
                + verificationUrl + "\n\n"
                + (tempPassword != null
                ? "Your temporary password is: " + tempPassword + "\n"
                + "You will be required to change this password on first login.\n\n"
                : "")
                + "This link will expire in 24 hours.\n\n"
                + "If you didn't create an account, please ignore this email.\n\n"
                + "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, text, html);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Digital Cafe - Password Reset Request";
        String resetUrl = frontendUrl + "/auth/reset-password?token=" + token;
        String content = """
                <p class="dc-text">We received a request to reset your password.</p>
                <div class="dc-card">
                    <p class="dc-label">Security Notice</p>
                    <p class="dc-value">Use the button below to create a new password. This reset link expires in <strong>1 hour</strong>.</p>
                </div>
                """;
        String html = buildEmailTemplate(
                "Password Reset Request",
                "Secure your Digital Cafe account",
                content,
                "Reset Password",
                resetUrl,
                "If you did not request this change, please ignore this email."
        );
        String text = "Hello,\n\n"
                + "You requested to reset your password. Click the link below to reset it:\n"
                + resetUrl + "\n\n"
                + "This link will expire in 1 hour.\n\n"
                + "If you didn't request this, please ignore this email.\n\n"
                + "Best regards,\nDigital Cafe Team";
        sendEmail(to, subject, text, html);
    }

    @Override
    public void sendPasswordChangedNotification(String to) {
        String subject = "Digital Cafe - Password Changed Successfully";
        String content = """
                <p class="dc-text">Your password has been changed successfully.</p>
                <div class="dc-card">
                    <p class="dc-label">Did not do this?</p>
                    <p class="dc-value">If this wasn't you, contact support immediately and reset your credentials.</p>
                </div>
                """;
        String html = buildEmailTemplate(
                "Password Updated",
                "Security confirmation",
                content,
                "Open Digital Cafe",
                frontendUrl,
                "Keep your account safe by using a strong and unique password."
        );
        String text = "Hello,\n\n"
                + "Your password has been changed successfully.\n\n"
                + "If you didn't make this change, please contact support immediately.\n\n"
                + "Best regards,\nDigital Cafe Team";
        sendEmail(to, subject, text, html);
    }

    @Override
    public void sendApprovalConfirmationEmail(String to) {
        String subject = "Digital Cafe - Registration Approved";
        String content = """
                <p class="dc-text">Your registration has been approved by the admin.</p>
                <div class="dc-card">
                    <p class="dc-label">Status</p>
                    <p class="dc-value">Your account is now active. You can log in and start using the platform.</p>
                </div>
                """;
        String html = buildEmailTemplate(
                "Registration Approved",
                "Your account is ready",
                content,
                "Login Now",
                frontendUrl + "/auth/login",
                "Need help? Contact your cafe administrator."
        );
        String text = "Hello,\n\n"
                + "Your registration has been approved by the admin.\n"
                + "You can now log in to your account.\n\n"
                + "Best regards,\nDigital Cafe Team";
        sendEmail(to, subject, text, html);
    }

    @Override
    public void sendRejectionEmail(String to) {
        String subject = "Digital Cafe - Registration Rejected";
        String content = """
                <p class="dc-text">Your registration request was not approved.</p>
                <div class="dc-card">
                    <p class="dc-label">Next Step</p>
                    <p class="dc-value">Please contact support or your cafe administrator for more details.</p>
                </div>
                """;
        String html = buildEmailTemplate(
                "Registration Update",
                "Action required",
                content,
                "Contact Support",
                frontendUrl + "/contact",
                "You can reapply once details are corrected."
        );
        String text = "Hello,\n\n"
                + "Your registration request was rejected by the admin.\n"
                + "Please contact support for more details.\n\n"
                + "Best regards,\nDigital Cafe Team";
        sendEmail(to, subject, text, html);
    }

    @Override
    public void sendWelcomeEmail(String to, String username, String tempPassword) {
        String subject = "Welcome to Digital Cafe";
        String content = """
                <p class="dc-text">Hello <strong>%s</strong>, welcome to Digital Cafe.</p>
                <div class="dc-card">
                    <p class="dc-label">Login Email</p>
                    <p class="dc-value">%s</p>
                </div>
                <div class="dc-card">
                    <p class="dc-label">Temporary Password</p>
                    <p class="dc-code">%s</p>
                    <p class="dc-note">You will be required to change this password after first login.</p>
                </div>
                """.formatted(escapeHtml(username), escapeHtml(to), escapeHtml(tempPassword));
        String html = buildEmailTemplate(
                "Welcome Aboard",
                "Your account has been created",
                content,
                "Go To Login",
                frontendUrl + "/auth/login",
                "Use your temporary password once, then set a new secure one."
        );
        String text = "Hello " + username + ",\n\n"
                + "Welcome to Digital Cafe!\n\n"
                + "Your account has been created. Here are your credentials:\n"
                + "Username: " + to + "\n"
                + "Temporary Password: " + tempPassword + "\n\n"
                + "You will be required to change your password on first login.\n\n"
                + "Best regards,\nDigital Cafe Team";
        sendEmail(to, subject, text, html);
    }

    @Override
    public void sendOrderConfirmation(String to, String orderDetails) {
        String subject = "Digital Cafe - Order Confirmation";
        String content = """
                <p class="dc-text">Your order has been confirmed.</p>
                <div class="dc-card">
                    <p class="dc-label">Order Details</p>
                    <p class="dc-value">%s</p>
                </div>
                """.formatted(escapeHtml(orderDetails).replace("\n", "<br/>"));
        String html = buildEmailTemplate(
                "Order Confirmed",
                "Your meal is on the way",
                content,
                "View Orders",
                frontendUrl + "/customer/orders",
                "Thank you for choosing Digital Cafe."
        );
        String text = "Hello,\n\n"
                + "Your order has been confirmed!\n\n"
                + orderDetails + "\n\n"
                + "Thank you for choosing Digital Cafe.\n\n"
                + "Best regards,\nDigital Cafe Team";
        sendEmail(to, subject, text, html);
    }

    @Override
    public void sendBookingConfirmation(String to, String bookingDetails) {
        String subject = "Digital Cafe - Booking Confirmation";
        String content = """
                <p class="dc-text">Your table booking has been confirmed.</p>
                <div class="dc-card">
                    <p class="dc-label">Booking Details</p>
                    <p class="dc-value">%s</p>
                </div>
                """.formatted(escapeHtml(bookingDetails).replace("\n", "<br/>"));
        String html = buildEmailTemplate(
                "Booking Confirmed",
                "We look forward to serving you",
                content,
                "View Bookings",
                frontendUrl + "/customer/bookings",
                "Arrive 10 minutes early for a smooth experience."
        );
        String text = "Hello,\n\n"
                + "Your table booking has been confirmed!\n\n"
                + bookingDetails + "\n\n"
                + "We look forward to serving you.\n\n"
                + "Best regards,\nDigital Cafe Team";
        sendEmail(to, subject, text, html);
    }

    @Override
    public void sendComprehensiveRegistrationSuccess(String to, String username) {
        String subject = "Welcome to Digital Cafe - Registration Successful!";
        String content = """
                <p class="dc-text">Hello <strong>%s</strong>, your registration is complete and your profile is fully set up.</p>
                <div class="dc-card">
                    <p class="dc-label">You can now</p>
                    <ul class="dc-list">
                        <li>Browse available cafes</li>
                        <li>Book tables</li>
                        <li>Place orders</li>
                        <li>Track bookings and orders</li>
                    </ul>
                </div>
                """.formatted(escapeHtml(username));
        String html = buildEmailTemplate(
                "Registration Successful",
                "Everything is ready",
                content,
                "Start Exploring",
                frontendUrl,
                "Thank you for choosing Digital Cafe."
        );
        String text = "Hello " + username + ",\n\n"
                + "Congratulations! Your account has been successfully created at Digital Cafe.\n\n"
                + "Your registration is complete and your profile is 100% filled. You can now:\n"
                + "- Browse available cafes\n"
                + "- Book tables\n"
                + "- Place orders\n"
                + "- Track your bookings and orders\n\n"
                + "Visit " + frontendUrl + " to log in and start exploring!\n\n"
                + "Thank you for choosing Digital Cafe.\n\n"
                + "Best regards,\nDigital Cafe Team";
        sendEmail(to, subject, text, html);
    }

    private void sendEmail(String to, String subject, String textBody, String htmlBody) {
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(textBody, htmlBody);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
            // Don't throw exception to avoid breaking the flow
        }
    }

    private String buildEmailTemplate(
            String heading,
            String subHeading,
            String contentHtml,
            String actionLabel,
            String actionUrl,
            String footerNote
    ) {
        String safeHeading = escapeHtml(heading);
        String safeSubHeading = escapeHtml(subHeading);
        String safeActionLabel = escapeHtml(actionLabel);
        String safeActionUrl = escapeHtml(actionUrl);
        String safeFooterNote = escapeHtml(footerNote);
        String safeYear = String.valueOf(java.time.Year.now().getValue());

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>%s</title>
                  <style>
                    body{margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#111827;}
                    .dc-wrap{width:100%%;padding:28px 12px;background:radial-gradient(circle at top,#ede9fe 0%%,#f9fafb 45%%,#f3f4f6 100%%);}
                    .dc-shell{max-width:640px;margin:0 auto;}
                    .dc-brand{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
                    .dc-logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;font-weight:800;font-size:18px;line-height:40px;text-align:center;box-shadow:0 10px 20px rgba(37,99,235,.28);}
                    .dc-brand-text{font-size:20px;font-weight:700;color:#111827;}
                    .dc-panel{background:#ffffff;border-radius:20px;padding:30px;border:1px solid #e5e7eb;box-shadow:0 18px 40px rgba(15,23,42,.08);}
                    .dc-pill{display:inline-block;padding:6px 12px;border-radius:999px;background:#dbeafe;color:#1e40af;font-size:12px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;}
                    .dc-title{font-size:28px;line-height:1.2;margin:14px 0 8px;font-weight:800;color:#0f172a;}
                    .dc-subtitle{margin:0 0 20px;color:#475569;font-size:15px;}
                    .dc-text{margin:0 0 16px;color:#334155;line-height:1.65;font-size:15px;}
                    .dc-card{margin:0 0 14px;padding:14px 16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;}
                    .dc-label{margin:0 0 8px;font-size:12px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:.03em;}
                    .dc-value{margin:0;color:#0f172a;line-height:1.55;font-size:14px;}
                    .dc-code{margin:0 0 8px;padding:10px 12px;background:#0f172a;color:#f8fafc;border-radius:10px;font-family:Consolas,Monaco,'Courier New',monospace;font-size:14px;word-break:break-all;}
                    .dc-note{margin:0;color:#64748b;font-size:13px;line-height:1.5;}
                    .dc-list{margin:8px 0 0;padding-left:18px;color:#0f172a;}
                    .dc-list li{margin:6px 0;line-height:1.45;}
                    .dc-cta{display:inline-block;margin:12px 0 8px;padding:13px 20px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff !important;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 10px 22px rgba(37,99,235,.28);}
                    .dc-alt{margin:8px 0 0;font-size:12px;color:#64748b;line-height:1.5;word-break:break-all;}
                    .dc-foot{margin-top:16px;text-align:center;color:#64748b;font-size:12px;line-height:1.6;}
                    @media (max-width:640px){.dc-panel{padding:22px;border-radius:16px}.dc-title{font-size:24px}}
                  </style>
                </head>
                <body>
                  <div class="dc-wrap">
                    <div class="dc-shell">
                      <div class="dc-brand">
                        <div class="dc-logo">DC</div>
                        <div class="dc-brand-text">Digital Cafe</div>
                      </div>
                      <div class="dc-panel">
                        <span class="dc-pill">Digital Cafe Platform</span>
                        <h1 class="dc-title">%s</h1>
                        <p class="dc-subtitle">%s</p>
                        %s
                        <a class="dc-cta" href="%s" target="_blank" rel="noopener noreferrer">%s</a>
                        <p class="dc-alt">If the button does not work, copy and paste this link:<br/>%s</p>
                      </div>
                      <div class="dc-foot">
                        %s<br/>
                        &copy; %s Digital Cafe Team
                      </div>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                safeHeading,
                safeHeading,
                safeSubHeading,
                contentHtml,
                safeActionUrl,
                safeActionLabel,
                safeActionUrl,
                safeFooterNote,
                safeYear
        );
    }

    private String escapeHtml(String input) {
        if (input == null) {
            return "";
        }
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}

