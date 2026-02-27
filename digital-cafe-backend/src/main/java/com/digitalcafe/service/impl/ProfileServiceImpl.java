package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.ProfileRequest;
import com.digitalcafe.dto.response.ProfileResponse;
import com.digitalcafe.entity.AcademicInfo;
import com.digitalcafe.entity.Profile;
import com.digitalcafe.entity.User;
import com.digitalcafe.entity.WorkExperience;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.ProfileMapper;
import com.digitalcafe.repository.ProfileRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ProfileMapper profileMapper;

    @Override
    @Transactional
    public ProfileResponse createOrUpdateProfile(Long userId, ProfileRequest request) {
        log.info("Creating or updating profile for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Profile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Profile newProfile = new Profile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        // Update basic information
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setDateOfBirth(request.getDateOfBirth());

        // Parse gender string to enum
        if (request.getGender() != null) {
            profile.setGender(Profile.Gender.valueOf(request.getGender().toUpperCase()));
        }

        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setProfilePictureUrl(request.getProfilePictureUrl());

        // Update address
        if (request.getAddress() != null) {
            var address = profileMapper.toAddressEntity(request.getAddress());
            address.setProfile(profile);
            profile.setAddress(address);
        }

        // Clear and update academic information
        if (request.getAcademicInformation() != null && !request.getAcademicInformation().isEmpty()) {
            profile.getAcademicInformation().clear();
            var academicInfos = profileMapper.toAcademicInfoEntityList(request.getAcademicInformation());
            for (AcademicInfo info : academicInfos) {
                info.setProfile(profile);
                profile.getAcademicInformation().add(info);
            }
        }

        // Clear and update work experiences
        if (request.getWorkExperiences() != null && !request.getWorkExperiences().isEmpty()) {
            profile.getWorkExperiences().clear();
            var workExperiences = profileMapper.toWorkExperienceEntityList(request.getWorkExperiences());
            for (WorkExperience exp : workExperiences) {
                exp.setProfile(profile);
                profile.getWorkExperiences().add(exp);
            }
        }

        profile = profileRepository.save(profile);
        log.info("Profile saved successfully for user: {}", userId);

        return profileMapper.toResponse(profile);
    }

    @Override
    public ProfileResponse getProfileByUserId(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user"));
        return profileMapper.toResponse(profile);
    }

    @Override
    public int calculateProfileCompletion(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user"));

        return profile.calculateCompletionPercentage();
    }

    @Override
    public boolean isProfileComplete(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user"));

        // Profile is complete if completion percentage is 100%
        return profile.calculateCompletionPercentage() == 100;
    }
}
