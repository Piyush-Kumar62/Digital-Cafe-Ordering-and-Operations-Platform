package com.digitalcafe.service;

import com.digitalcafe.entity.EmailVerificationToken;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.repository.CafeGalleryRepository;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.EmailVerificationTokenRepository;
import com.digitalcafe.repository.PasswordResetTokenRepository;
import com.digitalcafe.repository.RoleRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.dto.request.LoginRequest;
import com.digitalcafe.security.JwtUtil;
import com.digitalcafe.security.UserAccessPolicy;
import com.digitalcafe.service.impl.AuthServiceImpl;
import com.digitalcafe.websocket.WebSocketNotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private CafeRepository cafeRepository;
    @Mock private CafeGalleryRepository cafeGalleryRepository;
    @Mock private EmailVerificationTokenRepository emailVerificationTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtil jwtUtil;
    @Mock private EmailService emailService;
    @Mock private DocumentStorageService documentStorageService;
    @Mock private AdminProfileService adminProfileService;
    @Mock private com.digitalcafe.storage.FileStorageService fileStorageService;
    @Mock private UserAccessPolicy userAccessPolicy;
    @Mock private WebSocketNotificationService webSocketNotificationService;

    @InjectMocks
    private AuthServiceImpl authService;

    private void enableLockoutForTests(int maxAttempts, int durationMinutes) {
        ReflectionTestUtils.setField(authService, "lockoutEnabled", true);
        ReflectionTestUtils.setField(authService, "maxFailedAttempts", maxAttempts);
        ReflectionTestUtils.setField(authService, "lockoutDurationMinutes", durationMinutes);
    }

    @Test
    void verifyEmailShouldRejectInvalidToken() {
        when(emailVerificationTokenRepository.findByToken("bad-token"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail("bad-token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid verification token");
    }

    @Test
    void verifyEmailShouldRejectExpiredToken() {
        EmailVerificationToken token = new EmailVerificationToken();
        token.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(emailVerificationTokenRepository.findByToken("expired"))
                .thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.verifyEmail("expired"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Verification token expired");
    }

    @Test
    void verifyEmailShouldMarkUserVerifiedAndSendSuccessEmail() {
        User user = new User();
        user.setEmail("customer@test.com");
        user.setIsEmailVerified(false);
        user.setRegistrationStatus(null);

        EmailVerificationToken token = new EmailVerificationToken();
        token.setToken("token-123");
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusHours(1));

        when(emailVerificationTokenRepository.findByToken("token-123"))
                .thenReturn(Optional.of(token));
        when(userAccessPolicy.isSystemAdmin(user)).thenReturn(false);

        authService.verifyEmail("token-123");

        verify(userRepository).save(user);
        verify(emailVerificationTokenRepository).delete(token);
        verify(emailService).sendComprehensiveRegistrationSuccess("customer@test.com", "customer@test.com");
    }

    @Test
    void verifyEmailShouldBypassAdminUsers() {
        User user = new User();
        user.setEmail("cafehub.admin@gmail.com");

        EmailVerificationToken token = new EmailVerificationToken();
        token.setToken("admin-token");
        token.setUser(user);
        token.setExpiresAt(LocalDateTime.now().plusHours(1));

        when(emailVerificationTokenRepository.findByToken("admin-token"))
                .thenReturn(Optional.of(token));
        when(userAccessPolicy.isSystemAdmin(user)).thenReturn(true);

        authService.verifyEmail("admin-token");

        verify(emailVerificationTokenRepository).delete(token);
        verify(userRepository, never()).save(user);
        verify(emailService, never()).sendComprehensiveRegistrationSuccess(user.getEmail(), user.getEmail());
    }

    @Test
    void loginShouldRejectInactiveUser() {
        User user = new User();
        user.setEmail("inactive@test.com");
        user.setIsActive(false);

        when(userRepository.findByEmail("inactive@test.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("inactive@test.com");
        request.setPassword("Password@123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Account is disabled");
    }

    @Test
    void loginShouldRejectPendingApprovalUser() {
        User user = new User();
        user.setEmail("pending@test.com");
        user.setIsActive(true);
        user.setRegistrationStatus(User.RegistrationStatus.PENDING_APPROVAL);

        when(userRepository.findByEmail("pending@test.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("pending@test.com");
        request.setPassword("Password@123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Registration is not approved yet");
    }

    @Test
    void loginShouldRejectUnverifiedEmail() {
        User user = new User();
        user.setEmail("unverified@test.com");
        user.setIsActive(true);
        user.setRegistrationStatus(User.RegistrationStatus.APPROVED);
        user.setIsEmailVerified(false);

        when(userRepository.findByEmail("unverified@test.com")).thenReturn(Optional.of(user));
        when(userAccessPolicy.isSystemAdmin(user)).thenReturn(false);
        when(userAccessPolicy.requiresEmailVerification(user)).thenReturn(true);

        LoginRequest request = new LoginRequest();
        request.setEmail("unverified@test.com");
        request.setPassword("Password@123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("verify your email");
    }

    @Test
    void loginShouldLockUserAfterConfiguredFailedAttempts() {
        enableLockoutForTests(3, 15);
        User user = new User();
        user.setId(10L);
        user.setEmail("lock@test.com");
        user.setIsActive(true);
        user.setRegistrationStatus(User.RegistrationStatus.APPROVED);
        user.setIsEmailVerified(true);
        user.setFailedLoginAttempts(2);
        user.setRoles(Set.of());

        when(userRepository.findByEmail("lock@test.com")).thenReturn(Optional.of(user));
        when(userAccessPolicy.isSystemAdmin(user)).thenReturn(false);
        when(userAccessPolicy.requiresEmailVerification(user)).thenReturn(true);
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest request = new LoginRequest();
        request.setEmail("lock@test.com");
        request.setPassword("WrongPassword@123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid credentials");

        verify(userRepository).save(user);
    }

    @Test
    void loginShouldRejectLockedUserUntilLockExpires() {
        enableLockoutForTests(5, 15);
        User user = new User();
        user.setId(11L);
        user.setEmail("locked@test.com");
        user.setIsActive(true);
        user.setRegistrationStatus(User.RegistrationStatus.APPROVED);
        user.setIsEmailVerified(true);
        user.setLockedUntil(LocalDateTime.now().plusMinutes(5));

        when(userRepository.findByEmail("locked@test.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("locked@test.com");
        request.setPassword("Password@123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Too many failed login attempts");

        verify(authenticationManager, never()).authenticate(any());
    }
}
