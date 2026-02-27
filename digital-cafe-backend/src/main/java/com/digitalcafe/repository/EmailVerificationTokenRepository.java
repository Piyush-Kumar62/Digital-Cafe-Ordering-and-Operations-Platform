package com.digitalcafe.repository;

import com.digitalcafe.entity.EmailVerificationToken;
import com.digitalcafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for EmailVerificationToken entity operations.
 * Provides database access for email verification token management.
 */
@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    /**
     * Finds a token by its string value.
     * @param token the token string
     * @return Optional containing the token if found
     */
    Optional<EmailVerificationToken> findByToken(String token);

    /**
     * Finds all tokens for a user.
     * @param userId the user ID
     * @return list of tokens
     */
    List<EmailVerificationToken> findByUserId(Long userId);

    /**
     * Finds the latest unused token for a user.
     * @param userId the user ID
     * @return Optional containing the latest unused token
     */
    Optional<EmailVerificationToken> findFirstByUserIdAndIsUsedFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Deletes all tokens for a specific user.
     * @param user the user
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.user = :user")
    void deleteByUser(User user);

    /**
     * Deletes all tokens for a user by user ID.
     * @param userId the user ID
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.user.id = :userId")
    void deleteByUserId(Long userId);

    /**
     * Deletes expired tokens and returns count of deleted records.
     * @param dateTime cutoff datetime
     * @return number of deleted records
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < :dateTime")
    int deleteExpiredTokens(LocalDateTime dateTime);

    /**
     * Marks all user tokens as invalid (used).
     * @param userId the user ID
     */
    @Modifying
    @Query("UPDATE EmailVerificationToken t SET t.isUsed = true WHERE t.user.id = :userId AND t.isUsed = false")
    void invalidateUserTokens(Long userId);
}

