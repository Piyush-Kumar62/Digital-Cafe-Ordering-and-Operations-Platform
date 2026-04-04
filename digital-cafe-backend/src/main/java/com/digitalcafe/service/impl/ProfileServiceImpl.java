package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.ProfileRequest;
import com.digitalcafe.dto.response.ProfileResponse;
import com.digitalcafe.entity.AcademicInfo;
import com.digitalcafe.entity.Address;
import com.digitalcafe.entity.Profile;
import com.digitalcafe.entity.User;
import com.digitalcafe.entity.WorkExperience;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.ProfileMapper;
import com.digitalcafe.repository.AcademicInfoRepository;
import com.digitalcafe.repository.ProfileRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.repository.WorkExperienceRepository;
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
    private final AcademicInfoRepository academicInfoRepository;
    private final WorkExperienceRepository workExperienceRepository;

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


        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setDateOfBirth(request.getDateOfBirth());


        if (request.getGender() != null) {
            profile.setGender(parseGenderOrThrow(request.getGender()));
        }

        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setProfilePictureUrl(request.getProfilePictureUrl());
        profile.setGovtIdType(normalize(request.getGovtIdType()));
        profile.setGovtIdNumber(normalize(request.getGovtIdNumber()));


        if (request.getAddress() != null) {
            Address address = profile.getAddress() != null ? profile.getAddress() : new Address();
            address.setProfile(profile);
            address.setStreet(normalize(request.getAddress().getStreet()));
            address.setPlotNumber(normalize(request.getAddress().getPlotNumber()));
            address.setCity(normalize(request.getAddress().getCity()));
            address.setState(normalize(request.getAddress().getState()));
            address.setCountry(normalize(request.getAddress().getCountry()));
            String incomingPincode = normalize(request.getAddress().getPincode());
            if (incomingPincode != null) {
                address.setPincode(incomingPincode);
            }
            profile.setAddress(address);
        }


        if (request.getAcademicInformation() != null && !request.getAcademicInformation().isEmpty()) {
            profile.getAcademicInformation().clear();
            var academicInfos = profileMapper.toAcademicInfoEntityList(request.getAcademicInformation());
            for (AcademicInfo info : academicInfos) {
                info.setProfile(profile);
                profile.getAcademicInformation().add(info);
            }
        }


        if (request.getWorkExperiences() != null && !request.getWorkExperiences().isEmpty()) {
            profile.getWorkExperiences().clear();
            var workExperiences = profileMapper.toWorkExperienceEntityList(request.getWorkExperiences());
            for (WorkExperience exp : workExperiences) {
                exp.setProfile(profile);
                profile.getWorkExperiences().add(exp);
            }
        }

        profile = profileRepository.save(profile);
        updateUserProfileCompletion(user, profile);
        log.info("Profile saved successfully for user: {}", userId);

        return profileMapper.toResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUserId(Long userId) {
        Profile profile = profileRepository.findWithDetailsByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user"));
        loadCollections(profile);
        return profileMapper.toResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public int calculateProfileCompletion(Long userId) {
        Profile profile = profileRepository.findWithDetailsByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user"));
        loadCollections(profile);

        return profile.calculateCompletionPercentage();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isProfileComplete(Long userId) {
        Profile profile = profileRepository.findWithDetailsByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user"));
        loadCollections(profile);


        return profile.calculateCompletionPercentage() == 100;
    }

    @Override
    @Transactional
    public ProfileResponse addAcademicInfo(Long userId, ProfileRequest.AcademicInfoRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Profile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Profile created = new Profile();
                    created.setUser(user);
                    return created;
                });

        AcademicInfo academicInfo = profileMapper.toAcademicInfoEntity(request);
        academicInfo.setProfile(profile);
        profile.getAcademicInformation().add(academicInfo);

        profile = profileRepository.save(profile);
        updateUserProfileCompletion(user, profile);
        return profileMapper.toResponse(profile);
    }

    @Override
    @Transactional
    public ProfileResponse addWorkExperience(Long userId, ProfileRequest.WorkExperienceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Profile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Profile created = new Profile();
                    created.setUser(user);
                    return created;
                });

        WorkExperience workExperience = profileMapper.toWorkExperienceEntity(request);
        workExperience.setProfile(profile);
        profile.getWorkExperiences().add(workExperience);

        profile = profileRepository.save(profile);
        updateUserProfileCompletion(user, profile);
        return profileMapper.toResponse(profile);
    }

    private void updateUserProfileCompletion(User user, Profile profile) {
        int completionPercentage = profile.calculateCompletionPercentage();
        user.setProfileCompletionPercentage(completionPercentage);
        user.setIsProfileComplete(profile.isComplete());
        userRepository.save(user);
    }

    private void loadCollections(Profile profile) {
        if (profile == null || profile.getId() == null) {
            return;
        }
        // Load bags separately to avoid MultipleBagFetchException
        profile.setAcademicInformation(academicInfoRepository.findByProfileId(profile.getId()));
        profile.setWorkExperiences(workExperienceRepository.findByProfileId(profile.getId()));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Profile.Gender parseGenderOrThrow(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        try {
            return Profile.Gender.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid gender value: " + value);
        }
    }
}
