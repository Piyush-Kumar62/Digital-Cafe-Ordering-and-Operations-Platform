package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Email verification token entity for handling email verification flow.
 * Tokens expire after a configured time period.
 */
@Entity
@Table(name = "email_verification_tokens", indexes = {
        @Index(name = "idx_token", columnList = "token"),
        @Index(name = "idx_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerificationToken extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_used", nullable = false)
    @Builder.Default
    private Boolean isUsed = false;

    @Column(name = "expires_at", nullable = false)
    private java.time.LocalDateTime expiresAt;

    /**
     * Checks if token is valid (not used and not expired).
     */
    public boolean isValid() {
        return !isUsed && java.time.LocalDateTime.now().isBefore(expiresAt);
    }

    /**
     * Marks token as used.
     */
    public void markAsUsed() {
        this.isUsed = true;
    }
}
