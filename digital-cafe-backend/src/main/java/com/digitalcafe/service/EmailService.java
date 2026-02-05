package com.digitalcafe.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.name}")
    private String appName;

    public void sendVerificationEmail(String to, String username, String verificationToken) {
        String subject = "Verify Your Email - " + appName;
        String verificationLink = "http://localhost:4200/verify-email?token=" + verificationToken;
        
        String htmlContent = buildVerificationEmailContent(username, verificationLink);
        
        sendHtmlEmail(to, subject, htmlContent);
    }

    public void sendWelcomeEmail(String to, String username, String tempPassword) {
        String subject = "Welcome to " + appName;
        
        String htmlContent = buildWelcomeEmailContent(username, tempPassword);
        
        sendHtmlEmail(to, subject, htmlContent);
    }

    public void sendPasswordResetEmail(String to, String username) {
        String subject = "Password Reset Successful - " + appName;
        
        String htmlContent = buildPasswordResetEmailContent(username);
        
        sendHtmlEmail(to, subject, htmlContent);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildVerificationEmailContent(String username, String verificationLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ce1212; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 30px; background-color: #ce1212; 
                             color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>%s</h1>
                    </div>
                    <div class="content">
                        <h2>Hello %s,</h2>
                        <p>Thank you for registering with Digital Cafe Platform!</p>
                        <p>Please verify your email address by clicking the button below:</p>
                        <div style="text-align: center;">
                            <a href="%s" class="button">Verify Email</a>
                        </div>
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; color: #ce1212;">%s</p>
                        <p>This link will expire in 24 hours.</p>
                    </div>
                    <div class="footer">
                        <p>If you didn't create an account, please ignore this email.</p>
                        <p>&copy; 2026 Digital Cafe Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(appName, username, verificationLink, verificationLink);
    }

    private String buildWelcomeEmailContent(String username, String tempPassword) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ce1212; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #ce1212; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to %s</h1>
                    </div>
                    <div class="content">
                        <h2>Hello %s,</h2>
                        <p>Your account has been successfully created!</p>
                        <div class="credentials">
                            <p><strong>Username:</strong> %s</p>
                            <p><strong>Temporary Password:</strong> %s</p>
                        </div>
                        <p><strong>Important:</strong> You must reset your password on first login for security reasons.</p>
                        <p>Please also complete your profile and verify your email to access all features.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Digital Cafe Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(appName, username, username, tempPassword);
    }

    private String buildPasswordResetEmailContent(String username) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ce1212; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Successful</h1>
                    </div>
                    <div class="content">
                        <h2>Hello %s,</h2>
                        <p>Your password has been successfully reset.</p>
                        <p>If you did not make this change, please contact support immediately.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Digital Cafe Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(username);
    }
}
