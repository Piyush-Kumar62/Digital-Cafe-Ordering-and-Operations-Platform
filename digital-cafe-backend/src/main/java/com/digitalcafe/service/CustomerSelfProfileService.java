package com.digitalcafe.service;

import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import com.digitalcafe.dto.request.CustomerSelfProfileUpdateDTO;
import com.digitalcafe.dto.response.CustomerSelfProfileResponseDTO;

public interface CustomerSelfProfileService {
    CustomerSelfProfileResponseDTO getProfile(Authentication authentication);

    CustomerSelfProfileResponseDTO updateProfile(Authentication authentication, CustomerSelfProfileUpdateDTO request);

    String updateProfileImage(Authentication authentication, MultipartFile file);

    CustomerSelfProfileResponseDTO uploadGovtIdDocument(Authentication authentication, MultipartFile file);

    CustomerSelfProfileResponseDTO deleteGovtIdDocument(Authentication authentication);

    void deleteProfileImage(Authentication authentication);
}
