package com.digitalcafe.service;

import com.digitalcafe.dto.request.LoginRequest;
import com.digitalcafe.dto.request.SimpleRegisterRequest;
import com.digitalcafe.dto.request.RegisterRequest;
import com.digitalcafe.dto.request.ResetPasswordRequest;
import com.digitalcafe.dto.response.AuthResponse;
import com.digitalcafe.dto.response.RegisterResponse;

public interface AuthService {
    AuthResponse register(SimpleRegisterRequest request);
    RegisterResponse comprehensiveRegister(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void verifyEmail(String token);
    void resendVerificationEmail(String email);
    void forgotPassword(String email);
    void resetPassword(String token, ResetPasswordRequest request);
    void changePassword(String username, String oldPassword, String newPassword);
    AuthResponse refreshToken(String refreshToken);
}

