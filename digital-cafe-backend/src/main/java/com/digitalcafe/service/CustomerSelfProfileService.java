package com.digitalcafe.service;

import com.digitalcafe.dto.request.CustomerSelfProfileUpdateDTO;
import com.digitalcafe.dto.response.CustomerSelfProfileResponseDTO;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

public interface CustomerSelfProfileService {
    CustomerSelfProfileResponseDTO getProfile(Authentication authentication);

    CustomerSelfProfileResponseDTO updateProfile(Authentication authentication, CustomerSelfProfileUpdateDTO request);

    String updateProfileImage(Authentication authentication, MultipartFile file);

    void deleteProfileImage(Authentication authentication);
}
