package com.digitalcafe.service;

import com.digitalcafe.model.EmailVerification;
import com.digitalcafe.model.User;
import com.digitalcafe.repository.EmailVerificationRepository;
import com.digitalcafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class EmailVerificationService {

    @Autowired
    private EmailVerificationRepository verificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Transactional
    public void createVerificationToken(User user) {
        // Delete any existing tokens
        verificationRepository.deleteByUser(user);

        // Create new token
        EmailVerification verification = new EmailVerification();
        verification.setUser(user);
        verification.setVerificationToken(UUID.randomUUID().toString());
        verification.setTokenExpiryDate(LocalDateTime.now().plusHours(24));
        verification.setVerified(false);

        verificationRepository.save(verification);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), verification.getVerificationToken());
    }

    @Transactional
    public boolean verifyEmail(String token) {
        EmailVerification verification = verificationRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (verification.getTokenExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification token has expired");
        }

        if (verification.getVerified()) {
            throw new RuntimeException("Email already verified");
        }

        verification.setVerified(true);
        verification.setVerifiedAt(LocalDateTime.now());
        verificationRepository.save(verification);

        // Update user
        User user = verification.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        return true;
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmailVerified()) {
            throw new RuntimeException("Email already verified");
        }

        createVerificationToken(user);
    }

    @Transactional
    public String createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String resetToken = UUID.randomUUID().toString();

        // Send password reset email
        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), resetToken);

        return resetToken;
    }
}
