package com.digitalcafe.repository;

import com.digitalcafe.model.EmailVerification;
import com.digitalcafe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    Optional<EmailVerification> findByUserId(Long userId);
    Optional<EmailVerification> findByVerificationToken(String token);
    boolean existsByUserId(Long userId);
    void deleteByUser(User user);
}
