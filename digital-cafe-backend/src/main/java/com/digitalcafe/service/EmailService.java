package com.digitalcafe.service;

public interface EmailService {
    void sendVerificationEmail(String to, String token, String tempPassword);
    void sendPasswordResetEmail(String to, String token);
    void sendPasswordChangedNotification(String to);
    /** @param role   e.g. "CUSTOMER", "CAFE_OWNER", "CHEF", "WAITER" */
    void sendApprovalConfirmationEmail(String to, String username, String role);
    /** Backward-compat overload — role defaults to "USER" */
    default void sendApprovalConfirmationEmail(String to) {
        sendApprovalConfirmationEmail(to, "there", "USER");
    }
    void sendRejectionEmail(String to);
    /** @param role  human-readable role label, e.g. "Customer", "Chef", "Waiter", "Café Owner" */
    void sendWelcomeEmail(String to, String username, String tempPassword, String role, String dashboardUrl);
    /** Backward-compat overload */
    default void sendWelcomeEmail(String to, String username, String tempPassword) {
        sendWelcomeEmail(to, username, tempPassword, "User", "/auth/login");
    }
    void sendComprehensiveRegistrationSuccess(String to, String username);
    void sendOrderConfirmation(String to, String orderDetails);
    void sendPaymentReceipt(String to, String username, String receiptNumber, String paymentDetails);
    void sendBookingConfirmation(String to, String bookingDetails);
    /** Sends a login-notification email to the user after each successful sign-in. */
    void sendLoginNotification(String to, String username, String loginTime);
}

