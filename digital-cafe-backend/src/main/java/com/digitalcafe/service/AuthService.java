package com.digitalcafe.service;

import com.digitalcafe.dto.request.CafeOwnerRegisterRequest;
import com.digitalcafe.dto.request.LoginRequest;
import com.digitalcafe.dto.request.SimpleRegisterRequest;
import com.digitalcafe.dto.request.RegisterRequest;
import com.digitalcafe.dto.request.ResetPasswordRequest;
import com.digitalcafe.dto.response.AuthResponse;
import com.digitalcafe.dto.response.RegisterResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AuthService {
    AuthResponse register(SimpleRegisterRequest request);
    RegisterResponse comprehensiveRegister(RegisterRequest request);
    RegisterResponse comprehensiveRegisterWithGovtId(RegisterRequest request, MultipartFile govtIdProof);
    AuthResponse registerCafeOwner(CafeOwnerRegisterRequest request, MultipartFile logo, List<MultipartFile> galleryImages);
    AuthResponse login(LoginRequest request);
    void verifyEmail(String token);
    void resendVerificationEmail(String email);
    void forgotPassword(String email);
    void resetPassword(String token, ResetPasswordRequest request);
    void changePassword(String username, String oldPassword, String newPassword);
    AuthResponse refreshToken(String refreshToken);
    boolean isUsernameAvailable(String username);
}

