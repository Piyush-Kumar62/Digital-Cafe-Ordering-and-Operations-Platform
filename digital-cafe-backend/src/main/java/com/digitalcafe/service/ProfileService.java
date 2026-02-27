package com.digitalcafe.service;

import com.digitalcafe.dto.request.ProfileRequest;
import com.digitalcafe.dto.response.ProfileResponse;

/**
 * Service interface for user profile management operations.
 */
public interface ProfileService {

    /**
     * Create or update user profile
     */
    ProfileResponse createOrUpdateProfile(Long userId, ProfileRequest request);

    /**
     * Get profile by user ID
     */
    ProfileResponse getProfileByUserId(Long userId);

    /**
     * Calculate and update profile completion percentage
     */
    int calculateProfileCompletion(Long userId);

    /**
     * Check if profile is complete
     */
    boolean isProfileComplete(Long userId);

    /**
     * Add an academic entry to profile
     */
    ProfileResponse addAcademicInfo(Long userId, ProfileRequest.AcademicInfoRequest request);

    /**
     * Add a work experience entry to profile
     */
    ProfileResponse addWorkExperience(Long userId, ProfileRequest.WorkExperienceRequest request);
}
