package com.digitalcafe.service;

import com.digitalcafe.config.JwtUtil;
import com.digitalcafe.dto.*;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.model.EmailVerification;
import com.digitalcafe.model.Profile;
import com.digitalcafe.model.User;
import com.digitalcafe.repository.EmailVerificationRepository;
import com.digitalcafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        // Generate username from email
        String username = generateUsername(request.getEmail());
        
        // Ensure username is unique
        String finalUsername = username;
        int counter = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = username + counter;
            counter++;
        }

        // Create new user
        User user = new User();
        user.setUsername(finalUsername);
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.CUSTOMER);
        user.setActive(true);
        user.setEmailVerified(false);
        user.setProfileCompleted(false);
        user.setTempPassword(false);

        // Create profile
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setPhone(request.getPhoneNumber());
        profile.setCompletionPercentage(20); // Basic info provided
        user.setProfile(profile);

        // Save user
        user = userRepository.save(user);

        // Create email verification token
        createEmailVerificationToken(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .emailVerified(user.getEmailVerified())
                .profileCompleted(user.getProfileCompleted())
                .message("Registration successful! Please verify your email and complete your profile.")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by username or email
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()))
                .orElseThrow(() -> new BadRequestException("Invalid username/email or password"));

        // Check if user is active
        if (!user.getActive()) {
            throw new BadRequestException("Your account has been deactivated. Please contact support.");
        }

        // Authenticate
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .emailVerified(user.getEmailVerified())
                .profileCompleted(user.getProfileCompleted())
                .message("Login successful!")
                .build();
    }

    @Transactional
    public MessageResponse verifyEmail(String token) {
        EmailVerification verification = emailVerificationRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (verification.getVerified()) {
            throw new BadRequestException("Email already verified");
        }

        if (verification.getTokenExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        // Update verification
        verification.setVerified(true);
        verification.setVerifiedAt(LocalDateTime.now());
        emailVerificationRepository.save(verification);

        // Update user
        User user = verification.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        return new MessageResponse("Email verified successfully!");
    }

    @Transactional
    public MessageResponse resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.getEmailVerified()) {
            throw new BadRequestException("Email is already verified");
        }

        // Delete old verification token
        emailVerificationRepository.findByUserId(user.getId())
                .ifPresent(emailVerificationRepository::delete);

        // Create new verification token
        createEmailVerificationToken(user);

        return new MessageResponse("Verification email sent successfully!");
    }

    @Transactional
    public MessageResponse resetPassword(String username, PasswordResetRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTempPassword(false);
        userRepository.save(user);

        // Password reset confirmation email can be added later if needed
        log.info("Password reset successfully for user: {}", user.getEmail());

        return new MessageResponse("Password reset successfully!");
    }

    private void createEmailVerificationToken(User user) {
        String token = UUID.randomUUID().toString();
        
        EmailVerification verification = new EmailVerification();
        verification.setUser(user);
        verification.setVerificationToken(token);
        verification.setTokenExpiryDate(LocalDateTime.now().plusHours(24));
        verification.setVerified(false);
        
        emailVerificationRepository.save(verification);
        
        // Send verification email (with error handling)
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), token);
            log.info("Verification email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send verification email to: {}. Error: {}", user.getEmail(), e.getMessage());
            // Don't fail registration if email sending fails
        }
    }

    private String generateUsername(String email) {
        return email.substring(0, email.indexOf("@")).toLowerCase();
    }
}
