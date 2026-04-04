package com.digitalcafe.email;

/**
 * Enum mapping each email type to its Thymeleaf template name.
 *
 * <p>Template files are located at
 * {@code src/main/resources/templates/email/<templateName>.html}.</p>
 *
 * <p>To add a new email type:
 * <ol>
 *   <li>Add an entry here with a descriptive name and correct template name.</li>
 *   <li>Create the corresponding {@code .html} file under {@code templates/email/}.</li>
 *   <li>Add a method to {@code EmailService} and implement it in {@code EmailServiceImpl}.</li>
 * </ol>
 * </p>
 */
public enum EmailTemplateType {

    // Identity and authentication templates
    VERIFY_EMAIL("verify-email"),
    RESET_PASSWORD("reset-password"),
    PASSWORD_CHANGED("password-changed"),
    LOGIN_NOTIFICATION("login-notification"),

    // Onboarding templates
    WELCOME("welcome"),
    REGISTRATION_SUCCESS("registration-success"),
    ACCOUNT_ACTIVATED("account-activated"),

    // Admin decision templates
    REGISTRATION_APPROVED("registration-approved"),
    REGISTRATION_REJECTED("registration-rejected"),
    ACCOUNT_DEACTIVATED("account-deactivated"),
    ACCOUNT_REACTIVATED("account-reactivated"),

    // Order lifecycle templates
    ORDER_CONFIRMATION("order-confirmation"),
    PAYMENT_RECEIPT("payment-receipt"),
    ORDER_READY("order-ready"),
    ORDER_SERVED("order-served"),

    // Booking templates
    BOOKING_CONFIRMATION("booking-confirmation"),
    BOOKING_CANCELLED("booking-cancelled"),

    // Cancellation templates
    ORDER_CANCELLED("order-cancelled");

    private final String templateName;

    EmailTemplateType(String templateName) {
        this.templateName = templateName;
    }

    /**
     * Returns the template name (without path prefix or {@code .html} suffix).
     * The {@link com.digitalcafe.config.EmailConfig} resolver prepends
     * {@code templates/email/} and appends {@code .html} automatically.
     */
    public String getTemplateName() {
        return templateName;
    }
}
