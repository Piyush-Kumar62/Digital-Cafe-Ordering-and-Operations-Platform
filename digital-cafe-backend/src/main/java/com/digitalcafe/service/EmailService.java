package com.digitalcafe.service;

public interface EmailService {
    void sendVerificationEmail(String to, String token, String tempPassword);
    void sendPasswordResetEmail(String to, String token);
    void sendPasswordChangedNotification(String to);
    void sendApprovalConfirmationEmail(String to);
    void sendRejectionEmail(String to);
    void sendWelcomeEmail(String to, String username, String tempPassword);
    void sendComprehensiveRegistrationSuccess(String to, String username);
    void sendOrderConfirmation(String to, String orderDetails);
    void sendBookingConfirmation(String to, String bookingDetails);
}

