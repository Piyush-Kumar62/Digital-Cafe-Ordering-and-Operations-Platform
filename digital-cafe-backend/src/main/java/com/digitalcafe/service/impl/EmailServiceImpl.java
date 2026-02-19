package com.digitalcafe.service.impl;

import com.digitalcafe.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

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

        StringBuilder body = new StringBuilder();
        body.append("Welcome to Digital Cafe!\n\n");
        body.append("Please verify your email by clicking the link below:\n");
        body.append(verificationUrl).append("\n\n");

        if (tempPassword != null) {
            body.append("Your temporary password is: ").append(tempPassword).append("\n");
            body.append("You will be required to change this password on first login.\n\n");
        }

        body.append("This link will expire in 24 hours.\n\n");
        body.append("If you didn't create an account, please ignore this email.\n\n");
        body.append("Best regards,\nDigital Cafe Team");

        sendEmail(to, subject, body.toString());
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Digital Cafe - Password Reset Request";
        String resetUrl = frontendUrl + "/auth/reset-password?token=" + token;

        String body = "Hello,\n\n" +
                "You requested to reset your password. Click the link below to reset it:\n" +
                resetUrl + "\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you didn't request this, please ignore this email.\n\n" +
                "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, body);
    }

    @Override
    public void sendPasswordChangedNotification(String to) {
        String subject = "Digital Cafe - Password Changed Successfully";
        String body = "Hello,\n\n" +
                "Your password has been changed successfully.\n\n" +
                "If you didn't make this change, please contact support immediately.\n\n" +
                "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, body);
    }

    @Override
    public void sendApprovalConfirmationEmail(String to) {
        String subject = "Digital Cafe - Registration Approved";
        String body = "Hello,\n\n" +
                "Your registration has been approved by the admin.\n" +
                "You can now log in to your account.\n\n" +
                "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, body);
    }

    @Override
    public void sendRejectionEmail(String to) {
        String subject = "Digital Cafe - Registration Rejected";
        String body = "Hello,\n\n" +
                "Your registration request was rejected by the admin.\n" +
                "Please contact support for more details.\n\n" +
                "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, body);
    }

    @Override
    public void sendWelcomeEmail(String to, String username, String tempPassword) {
        String subject = "Welcome to Digital Cafe";
        String body = "Hello " + username + ",\n\n" +
                "Welcome to Digital Cafe!\n\n" +
                "Your account has been created. Here are your credentials:\n" +
                "Username: " + to + "\n" +
                "Temporary Password: " + tempPassword + "\n\n" +
                "You will be required to change your password on first login.\n\n" +
                "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, body);
    }

    @Override
    public void sendOrderConfirmation(String to, String orderDetails) {
        String subject = "Digital Cafe - Order Confirmation";
        String body = "Hello,\n\n" +
                "Your order has been confirmed!\n\n" +
                orderDetails + "\n\n" +
                "Thank you for choosing Digital Cafe.\n\n" +
                "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, body);
    }

    @Override
    public void sendBookingConfirmation(String to, String bookingDetails) {
        String subject = "Digital Cafe - Booking Confirmation";
        String body = "Hello,\n\n" +
                "Your table booking has been confirmed!\n\n" +
                bookingDetails + "\n\n" +
                "We look forward to serving you.\n\n" +
                "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, body);
    }

    @Override
    public void sendComprehensiveRegistrationSuccess(String to, String username) {
        String subject = "Welcome to Digital Cafe - Registration Successful!";
        String body = "Hello " + username + ",\n\n" +
                "Congratulations! Your account has been successfully created at Digital Cafe.\n\n" +
                "Your registration is complete and your profile is 100% filled. You can now:\n" +
                "- Browse available cafés\n" +
                "- Book tables\n" +
                "- Place orders\n" +
                "- Track your bookings and orders\n\n" +
                "Visit " + frontendUrl + " to log in and start exploring!\n\n" +
                "Thank you for choosing Digital Cafe.\n\n" +
                "Best regards,\nDigital Cafe Team";

        sendEmail(to, subject, body);
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", to, e);
            // Don't throw exception to avoid breaking the flow
        }
    }
}

