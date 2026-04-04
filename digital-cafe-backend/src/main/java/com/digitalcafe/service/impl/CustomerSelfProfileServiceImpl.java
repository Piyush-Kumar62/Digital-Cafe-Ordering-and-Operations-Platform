package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.CustomerSelfProfileUpdateDTO;
import com.digitalcafe.dto.response.CustomerSelfProfileResponseDTO;
import com.digitalcafe.entity.Address;
import com.digitalcafe.entity.Profile;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.repository.ProfileRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.CustomerSelfProfileService;
import com.digitalcafe.storage.FileStorageService;
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
    private final ProfileRepository profileRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional(readOnly = true)
    public CustomerSelfProfileResponseDTO getProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        syncProfileCompletion(user);
        return toResponse(user);
    }

    @Override
    @Transactional
    public CustomerSelfProfileResponseDTO updateProfile(Authentication authentication, CustomerSelfProfileUpdateDTO request) {
        User user = getAuthenticatedUser(authentication);

        Profile profile = profileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Profile created = new Profile();
                    created.setUser(user);
                    return created;
                });

        if (StringUtils.hasText(request.getFirstName())) {
            String firstName = request.getFirstName().trim();
            user.setFirstName(firstName);
            profile.setFirstName(firstName);
        }
        if (StringUtils.hasText(request.getLastName())) {
            String lastName = request.getLastName().trim();
            user.setLastName(lastName);
            profile.setLastName(lastName);
        }

        if (StringUtils.hasText(request.getDisplayName())) {
            user.setDisplayName(request.getDisplayName().trim());
        } else {
            String fallbackDisplayName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                    + (user.getLastName() == null ? "" : user.getLastName())).trim();
            if (StringUtils.hasText(fallbackDisplayName)) {
                user.setDisplayName(fallbackDisplayName);
            }
        }

        if (StringUtils.hasText(request.getPhoneNumber())) {
            String phone = request.getPhoneNumber().trim();
            user.setPhoneNumber(phone);
            profile.setPhoneNumber(phone);
        }
        if (request.getDateOfBirth() != null) {
            profile.setDateOfBirth(request.getDateOfBirth());
        }
        if (StringUtils.hasText(request.getGender())) {
            profile.setGender(parseGenderOrThrow(request.getGender()));
        }
        if (StringUtils.hasText(request.getGovtIdType())) {
            String govtIdType = request.getGovtIdType().trim();
            user.setGovtIdType(govtIdType);
            profile.setGovtIdType(govtIdType);
        }
        if (StringUtils.hasText(request.getGovtIdNumber())) {
            String govtIdNumber = request.getGovtIdNumber().trim();
            user.setGovtIdNumber(govtIdNumber);
            profile.setGovtIdNumber(govtIdNumber);
        }

        if (request.getAddress() != null) {
            Address address = profile.getAddress() != null ? profile.getAddress() : new Address();
            address.setProfile(profile);
            if (request.getAddress().getStreet() != null) address.setStreet(request.getAddress().getStreet().trim());
            if (request.getAddress().getPlotNumber() != null) address.setPlotNumber(request.getAddress().getPlotNumber().trim());
            if (request.getAddress().getCity() != null) address.setCity(request.getAddress().getCity().trim());
            if (request.getAddress().getState() != null) address.setState(request.getAddress().getState().trim());
            if (request.getAddress().getCountry() != null) address.setCountry(request.getAddress().getCountry().trim());
            if (StringUtils.hasText(request.getAddress().getPincode())) {
                address.setPincode(request.getAddress().getPincode().trim());
            }
            profile.setAddress(address);
        }

        if (request.getJoiningDate() != null) {
            user.setJoiningDate(request.getJoiningDate());
        }
        if (request.getExperienceYears() != null) {
            user.setExperienceYears(request.getExperienceYears());
        }
        if (StringUtils.hasText(request.getShift())) {
            user.setShift(request.getShift().trim());
        }

        profileRepository.save(profile);
        user.setProfile(profile);
        int completionPercentage = profile.calculateCompletionPercentage();
        user.setIsProfileComplete(completionPercentage == 100);
        user.setProfileCompletionPercentage(completionPercentage);
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

    private Profile.Gender parseGenderOrThrow(String value) {
        String normalized = value == null ? null : value.trim();
        if (!StringUtils.hasText(normalized)) {
            return null;
        }
        try {
            return Profile.Gender.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid gender value: " + value);
        }
    }

    @Transactional
    protected void syncProfileCompletion(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        Profile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        if (profile == null) {
            if (user.getProfileCompletionPercentage() != null && user.getProfileCompletionPercentage() != 0) {
                user.setProfileCompletionPercentage(0);
                user.setIsProfileComplete(false);
                userRepository.save(user);
            }
            return;
        }

        int completionPercentage = profile.calculateCompletionPercentage();
        boolean isComplete = completionPercentage == 100;
        Integer currentCompletion = user.getProfileCompletionPercentage();
        boolean needsUpdate = currentCompletion == null
                || currentCompletion != completionPercentage
                || !Boolean.valueOf(isComplete).equals(user.getIsProfileComplete());

        if (needsUpdate) {
            user.setProfileCompletionPercentage(completionPercentage);
            user.setIsProfileComplete(isComplete);
            userRepository.save(user);
        }
    }

    private CustomerSelfProfileResponseDTO toResponse(User user) {
        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> "ROLE_" + r.getName().name())
                .orElse("ROLE_CUSTOMER");
        Profile profile = user.getProfile();
        Address address = profile != null ? profile.getAddress() : null;
        String phoneNumber = profile != null && StringUtils.hasText(profile.getPhoneNumber())
                ? profile.getPhoneNumber()
                : user.getPhoneNumber();
        String govtIdType = profile != null && StringUtils.hasText(profile.getGovtIdType())
                ? profile.getGovtIdType()
                : user.getGovtIdType();
        String govtIdNumber = profile != null && StringUtils.hasText(profile.getGovtIdNumber())
                ? profile.getGovtIdNumber()
                : user.getGovtIdNumber();

        return CustomerSelfProfileResponseDTO.builder()
                .firstName(StringUtils.hasText(user.getFirstName())
                        ? user.getFirstName()
                        : profile != null ? profile.getFirstName() : null)
                .lastName(StringUtils.hasText(user.getLastName())
                        ? user.getLastName()
                        : profile != null ? profile.getLastName() : null)
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .role(role)
                .profileImageUrl(user.getProfileImageUrl())
                .phoneNumber(phoneNumber)
                .dateOfBirth(profile != null ? profile.getDateOfBirth() : null)
                .gender(profile != null && profile.getGender() != null ? profile.getGender().name() : null)
                .govtIdType(govtIdType)
                .govtIdNumber(govtIdNumber)
                .address(address == null ? null : CustomerSelfProfileResponseDTO.ProfileAddressResponse.builder()
                        .street(address.getStreet())
                        .plotNumber(address.getPlotNumber())
                        .city(address.getCity())
                        .state(address.getState())
                        .country(address.getCountry())
                        .pincode(address.getPincode())
                        .build())
                .joiningDate(user.getJoiningDate())
                .experienceYears(user.getExperienceYears())
                .shift(user.getShift())
                .accountStatus(user.getAccountStatus())
                .emailVerified(user.getEmailVerified())
                .profileCompletionPercentage(user.getProfileCompletionPercentage())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
