package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.LoginRequest;
import com.digitalcafe.dto.request.RegisterRequest;
import com.digitalcafe.dto.response.AuthResponse;
import com.digitalcafe.dto.response.RegisterResponse;
import com.digitalcafe.entity.*;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.repository.EmailVerificationTokenRepository;
import com.digitalcafe.repository.PasswordResetTokenRepository;
import com.digitalcafe.repository.RoleRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.security.JwtUtil;
import com.digitalcafe.service.AuthService;
import com.digitalcafe.service.EmailService;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    // =====================================================
    // REGISTER → SEND EMAIL VERIFICATION
    // =====================================================

    @Override
    @Transactional
    public RegisterResponse comprehensiveRegister(RegisterRequest request) {

        String email = request.getPersonalDetails().getEmail();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }

        Role role = roleRepository.findByName(Role.RoleName.valueOf(request.getRole()))
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRole()));

        User user = new User();
        user.setEmail(email);
        user.setUsername(email);
        user.setPassword(null);
        user.setIsActive(false);
        user.setIsEmailVerified(false);
        user.setMustResetPassword(true);
        user.setStatus(UserStatus.PENDING_VERIFICATION);

        user.getRoles().add(role);
        user = userRepository.save(user);

        // Create Profile
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setFirstName(request.getPersonalDetails().getFirstName());
        profile.setLastName(request.getPersonalDetails().getLastName());
        profile.setPhoneNumber(request.getPersonalDetails().getPhone());

        if (request.getPersonalDetails().getGender() != null) {
            profile.setGender(Profile.Gender.valueOf(request.getPersonalDetails().getGender()));
        }

        user.setProfile(profile);
        userRepository.save(user);

        // Create verification token
        EmailVerificationToken token = new EmailVerificationToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));
        emailVerificationTokenRepository.save(token);

        emailService.sendVerificationEmail(user.getEmail(), token.getToken(), null);

        log.info("User registered. Verification mail sent to {}", email);

        return RegisterResponse.builder()
                .message("Registration successful. Please verify your email.")
                .userId(user.getId())
                .email(user.getEmail())
                .role(request.getRole())
                .build();
    }

    // =====================================================
    // VERIFY EMAIL
    // =====================================================

    @Override
    @Transactional
    public void verifyEmail(String token) {

        EmailVerificationToken verificationToken =
                emailVerificationTokenRepository.findByToken(token)
                        .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token expired");
        }

        User user = verificationToken.getUser();

        if (user.getIsEmailVerified()) {
            throw new BadRequestException("Email already verified");
        }

        user.setIsEmailVerified(true);
        user.setStatus(UserStatus.VERIFIED);

        userRepository.save(user);
        emailVerificationTokenRepository.delete(verificationToken);

        log.info("Email verified for {}", user.getEmail());
    }

    // =====================================================
    // ADMIN APPROVES → SEND SET PASSWORD MAIL
    // =====================================================

    @Override
    @Transactional
    public void approveUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() != UserStatus.VERIFIED) {
            throw new BadRequestException("Only verified users can be approved");
        }

        user.setStatus(UserStatus.APPROVED);
        user.setApprovedAt(LocalDateTime.now());
        userRepository.save(user);

        // Remove old tokens
        passwordResetTokenRepository.deleteByUser(user);

        PasswordResetToken token = new PasswordResetToken();
        token.setToken(UUID.randomUUID().toString());
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusHours(24));
        passwordResetTokenRepository.save(token);

        emailService.sendSetPasswordMail(user.getEmail(), token.getToken());

        log.info("User approved. Password setup mail sent to {}", user.getEmail());
    }

    // =====================================================
    // USER SETS PASSWORD → ACCOUNT ACTIVE
    // =====================================================

    @Override
    @Transactional
    public void setPassword(String token, String password) {

        PasswordResetToken resetToken =
                passwordResetTokenRepository.findByToken(token)
                        .orElseThrow(() -> new BadRequestException("Invalid token"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Token expired");
        }

        User user = resetToken.getUser();

        if (user.getStatus() != UserStatus.APPROVED) {
            throw new BadRequestException("User is not approved yet");
        }

        user.setPassword(passwordEncoder.encode(password));
        user.setIsEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setIsActive(true);
        user.setMustResetPassword(false);
        user.setIsProfileComplete(true);

        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);

        emailService.sendWelcomeEmail(user.getEmail(), user.getProfile().getFirstName(), null);

        log.info("User activated successfully: {}", user.getEmail());
    }

    // =====================================================
    // LOGIN (ONLY ACTIVE USERS)
    // =====================================================

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Account is not active.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = jwtUtil.generateToken(authentication);
        String refreshToken = jwtUtil.generateRefreshToken(authentication);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())   // ✅ ADD
                .username(user.getUsername())   // ✅ ADD
                .email(user.getEmail())
                .roles(user.getRoles().stream().map(r -> r.getName().name()).toList())
                .status(user.getStatus().name())
                .isEmailVerified(Boolean.TRUE.equals(user.getIsEmailVerified())) // ✅ IMPORTANT
                .isProfileComplete(Boolean.TRUE.equals(user.getIsProfileComplete()))
                .profileCompletionPercentage(100)   // or calculate dynamically
                .message("Login successful")
                .build();

    }
}