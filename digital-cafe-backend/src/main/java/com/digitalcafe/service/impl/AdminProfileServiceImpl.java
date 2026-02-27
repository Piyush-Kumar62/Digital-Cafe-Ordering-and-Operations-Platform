package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.AdminProfileUpdateDTO;
import com.digitalcafe.dto.response.AdminProfileResponseDTO;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.entity.UserPreference;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.repository.UserPreferenceRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.AdminProfileService;
import com.digitalcafe.service.FileStorageService;
import com.digitalcafe.websocket.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminProfileServiceImpl implements AdminProfileService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final FileStorageService fileStorageService;
    private final WebSocketNotificationService webSocketNotificationService;

    @Override
    @Transactional
    public AdminProfileResponseDTO getAuthenticatedAdminProfile(Authentication authentication) {
        User user = getAuthenticatedAdmin(authentication);
        normalizeAdminInvariantFields(user);
        UserPreference preference = getOrCreatePreference(user);
        return toResponse(user, preference);
    }

    @Override
    @Transactional
    public AdminProfileResponseDTO updateAuthenticatedAdminProfile(
            Authentication authentication,
            AdminProfileUpdateDTO request
    ) {
        User user = getAuthenticatedAdmin(authentication);
        normalizeAdminInvariantFields(user);

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setDisplayName(request.getDisplayName().trim());

        UserPreference preference = getOrCreatePreference(user);
        preference.setTheme(request.getTheme());
        preference.setAutoRefreshSeconds(request.getAutoRefreshSeconds());
        preference.setAdminNotificationsEnabled(request.getAdminNotificationsEnabled());

        User savedUser = userRepository.save(user);
        UserPreference savedPreference = userPreferenceRepository.save(preference);

        AdminProfileResponseDTO response = toResponse(savedUser, savedPreference);
        webSocketNotificationService.sendProfileUpdate(savedUser.getId(), response);
        return response;
    }

    @Override
    @Transactional
    public String updateAuthenticatedAdminProfileImage(Authentication authentication, MultipartFile file) {
        User user = getAuthenticatedAdmin(authentication);
        normalizeAdminInvariantFields(user);
        String relativePath = fileStorageService.storeProfileImage(file);
        user.setProfileImageUrl(relativePath);
        userRepository.save(user);

        UserPreference preference = getOrCreatePreference(user);
        AdminProfileResponseDTO response = toResponse(user, preference);
        webSocketNotificationService.sendProfileUpdate(user.getId(), response);
        return relativePath;
    }

    @Override
    @Transactional
    public void removeAuthenticatedAdminProfileImage(Authentication authentication) {
        User user = getAuthenticatedAdmin(authentication);
        user.setProfileImageUrl(null);
        userRepository.save(user);

        UserPreference preference = getOrCreatePreference(user);
        AdminProfileResponseDTO response = toResponse(user, preference);
        webSocketNotificationService.sendProfileUpdate(user.getId(), response);
    }

    @Override
    @Transactional
    public void markLastLoginAndBroadcast(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        if (user.hasRole(Role.RoleName.ADMIN)) {
            UserPreference preference = getOrCreatePreference(user);
            AdminProfileResponseDTO response = toResponse(user, preference);
            webSocketNotificationService.sendProfileUpdate(user.getId(), response);
        }
    }

    private User getAuthenticatedAdmin(Authentication authentication) {
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            throw new BadRequestException("Authentication context is missing");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authentication.getName()));

        if (!user.hasRole(Role.RoleName.ADMIN)) {
            throw new AccessDeniedException("Only admin users can access this profile");
        }

        return user;
    }

    private UserPreference getOrCreatePreference(User user) {
        return userPreferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserPreference preference = UserPreference.builder()
                            .user(user)
                            .theme(UserPreference.Theme.LIGHT)
                            .autoRefreshSeconds(15)
                            .adminNotificationsEnabled(true)
                            .build();
                    user.setUserPreference(preference);
                    return userPreferenceRepository.save(preference);
                });
    }

    private void normalizeAdminInvariantFields(User user) {
        boolean requiresSave = false;
        if (!Boolean.TRUE.equals(user.getIsEmailVerified()) || !Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setIsEmailVerified(true);
            user.setEmailVerified(true);
            requiresSave = true;
        }
        if (requiresSave) {
            userRepository.save(user);
        }
    }

    private AdminProfileResponseDTO toResponse(User user, UserPreference preference) {
        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> "ROLE_" + r.getName().name())
                .orElse("ROLE_ADMIN");

        return AdminProfileResponseDTO.builder()
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .role(role)
                .profileImageUrl(user.getProfileImageUrl())
                .accountStatus(user.getAccountStatus())
                .emailVerified(user.getEmailVerified())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .preferences(AdminProfileResponseDTO.PreferencesDTO.builder()
                        .theme(preference.getTheme())
                        .autoRefreshSeconds(preference.getAutoRefreshSeconds())
                        .adminNotificationsEnabled(preference.getAdminNotificationsEnabled())
                        .build())
                .build();
    }
}
