package com.digitalcafe.repository;

import com.digitalcafe.entity.PasswordResetToken;
import com.digitalcafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository interface for PasswordResetToken entity.
 * Provides database operations for password reset token management.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Finds a password reset token by its token string.
     * @param token the token string
     * @return Optional containing the token if found
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Finds all tokens for a specific user.
     * @param user the user
     * @return Optional containing the most recent token if found
     */
    Optional<PasswordResetToken> findByUserAndIsUsedFalse(User user);

    /**
     * Deletes all tokens for a specific user.
     * Used when creating a new token to invalidate previous ones.
     * @param user the user
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user = :user")
    void deleteByUser(User user);

    /**
     * Deletes all expired tokens.
     * This can be run periodically to clean up old tokens.
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(LocalDateTime now);

    /**
     * Checks if a valid (unused and not expired) token exists for a user.
     * @param user the user
     * @param now current timestamp
     * @return true if valid token exists
     */
    boolean existsByUserAndIsUsedFalseAndExpiresAtAfter(User user, LocalDateTime now);
}
