package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.CustomerSelfProfileUpdateDTO;
import com.digitalcafe.dto.response.CustomerSelfProfileResponseDTO;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.CustomerSelfProfileService;
import com.digitalcafe.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CustomerSelfProfileServiceImpl implements CustomerSelfProfileService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public CustomerSelfProfileResponseDTO getProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return toResponse(user);
    }

    @Override
    @Transactional
    public CustomerSelfProfileResponseDTO updateProfile(Authentication authentication, CustomerSelfProfileUpdateDTO request) {
        User user = getAuthenticatedUser(authentication);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setDisplayName(request.getDisplayName().trim());
        // Customer self profile update is the required completion checkpoint.
        user.setIsProfileComplete(true);
        user.setProfileCompletionPercentage(100);
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public String updateProfileImage(Authentication authentication, MultipartFile file) {
        User user = getAuthenticatedUser(authentication);
        String relativePath = fileStorageService.storeProfileImage(file);
        user.setProfileImageUrl(relativePath);
        userRepository.save(user);
        return relativePath;
    }

    @Override
    @Transactional
    public void deleteProfileImage(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        user.setProfileImageUrl(null);
        userRepository.save(user);
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            throw new BadRequestException("Authentication context is missing");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authentication.getName()));
    }

    private CustomerSelfProfileResponseDTO toResponse(User user) {
        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> "ROLE_" + r.getName().name())
                .orElse("ROLE_CUSTOMER");

        return CustomerSelfProfileResponseDTO.builder()
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .role(role)
                .profileImageUrl(user.getProfileImageUrl())
                .accountStatus(user.getAccountStatus())
                .emailVerified(user.getEmailVerified())
                .profileCompletionPercentage(user.getProfileCompletionPercentage())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
