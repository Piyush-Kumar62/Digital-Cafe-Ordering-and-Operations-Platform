package com.digitalcafe.service;

import com.digitalcafe.dto.request.AdminProfileUpdateDTO;
import com.digitalcafe.dto.response.AdminProfileResponseDTO;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

public interface AdminProfileService {
    AdminProfileResponseDTO getAuthenticatedAdminProfile(Authentication authentication);

    AdminProfileResponseDTO updateAuthenticatedAdminProfile(Authentication authentication, AdminProfileUpdateDTO request);

    String updateAuthenticatedAdminProfileImage(Authentication authentication, MultipartFile file);

    void removeAuthenticatedAdminProfileImage(Authentication authentication);

    void markLastLoginAndBroadcast(Long userId);
}
