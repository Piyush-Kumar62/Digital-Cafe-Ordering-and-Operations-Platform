package com.digitalcafe.service.impl;

import com.digitalcafe.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;

// =====================================================
// CORE EMAIL SENDER
// =====================================================

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);

            log.info("Email sent successfully to {}", to);

        } catch (Exception e) {
            log.error("Email sending failed: {}", e.getMessage());
            throw new RuntimeException("Failed to send email");
        }
    }

// =====================================================
// APPROVAL FLOW EMAIL
// =====================================================

    @Override
    public void sendSetPasswordMail(String to, String token) {

        String link = "http://localhost:4200/auth/set-password?token=" + token;

        String subject = "Account Approved — Set Your Password";

        String body =
                "Your account has been approved by the administrator.\n\n"
                        + "Please create your password using the link below:\n"
                        + link
                        + "\n\nThis link expires in 24 hours.";

        sendEmail(to, subject, body);
    }

// =====================================================
// AUTH EMAILS
// =====================================================

    @Override
    public void sendPasswordResetEmail(String to, String token) {

        String link = "http://localhost:4200/reset-password?token=" + token;

        sendEmail(
                to,
                "Password Reset Request",
                "Click the link to reset your password:\n" + link
        );
    }

    @Override
    public void sendPasswordChangedNotification(String to) {

        sendEmail(
                to,
                "Password Changed Successfully",
                "Your password has been changed successfully.\n\n"
                        + "If this wasn't you, contact support immediately."
        );
    }

// =====================================================
// ACCOUNT EMAILS
// =====================================================

    @Override
    public void sendVerificationEmail(String to, String token, String ignored) {

        String link = "http://localhost:4200/auth/verify-email?token=" + token;

        String subject = "Verify Your Email — Digital Cafe";

        String body =
                "Welcome to Digital Cafe!\n\n"
                        + "Please verify your email by clicking the link below:\n"
                        + link
                        + "\n\nThis link will expire in 24 hours."
                        + "\n\nIf you did not register, please ignore this email.";

        sendEmail(to, subject, body);
    }

    @Override
    public void sendWelcomeEmail(String to, String username, String ignored) {

        sendEmail(
                to,
                "Welcome to Digital Cafe",
                "Hello " + username
                        + ",\n\nYour account is now active."
                        + "\nYou can log in using your email and password."
                        + "\n click the below link to login: http://localhost:4200/auth/login"
        );
    }

    @Override
    public void sendRegistrationSuccessEmail(String to, String username) {

        sendEmail(
                to,
                "Registration Submitted",
                "Hello " + username
                        + ",\n\nYour registration has been submitted successfully."
                        + "\nPlease wait for admin approval."
        );
    }

// =====================================================
// BUSINESS EMAILS
// =====================================================

    @Override
    public void sendOrderConfirmation(String to, String orderDetails) {

        sendEmail(
                to,
                "Order Confirmation",
                "Your order has been placed successfully!\n\n"
                        + orderDetails
        );
    }

    @Override
    public void sendBookingConfirmation(String to, String bookingDetails) {

        sendEmail(
                to,
                "Booking Confirmed",
                "Your booking is confirmed.\n\n"
                        + bookingDetails
        );
    }


}
