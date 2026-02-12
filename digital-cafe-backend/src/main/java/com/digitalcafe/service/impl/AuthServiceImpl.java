package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.*;
import com.digitalcafe.dto.response.AuthResponse;
import com.digitalcafe.dto.response.RegisterResponse;
import com.digitalcafe.entity.*;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.repository.*;
import com.digitalcafe.security.JwtUtil;
import com.digitalcafe.service.AuthService;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.util.PasswordGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final EmailVerificationTokenRepository emailVerificationTokenRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtUtil jwtUtil;
  private final EmailService emailService;

  // ================= SIMPLE REGISTER =================

  @Override
  @Transactional
  public AuthResponse register(SimpleRegisterRequest request) {

    if (userRepository.existsByEmail(request.getEmail())) {
      throw new BadRequestException("Email already registered");
    }

    Role customerRole = roleRepository.findByName(Role.RoleName.CUSTOMER)
        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "CUSTOMER"));

    String tempPassword = PasswordGenerator.generateTemporaryPassword();

    User user = new User();
    user.setEmail(request.getEmail());
    user.setUsername(request.getEmail());
    user.setPassword(passwordEncoder.encode(tempPassword));
    user.setIsActive(true);
    user.setIsEmailVerified(false);
    user.setIsProfileComplete(false);
    user.setMustResetPassword(true);

    // ✅ FIX: mutable collection
    user.getRoles().add(customerRole);

    user = userRepository.save(user);

    EmailVerificationToken token = new EmailVerificationToken();
    token.setToken(UUID.randomUUID().toString());
    token.setUser(user);
    token.setExpiresAt(LocalDateTime.now().plusHours(24));
    emailVerificationTokenRepository.save(token);

    emailService.sendVerificationEmail(user.getEmail(), token.getToken(), tempPassword);

    return AuthResponse.builder()
        .message("Registration successful. Please check your email to verify your account.")
        .email(user.getEmail())
        .build();
  }

  // ================= COMPREHENSIVE REGISTER =================

  @Override
  @Transactional
  public RegisterResponse comprehensiveRegister(RegisterRequest request) {

    if (userRepository.existsByEmail(request.getPersonalDetails().getEmail())
        || userRepository.existsByUsername(request.getUsername())) {
      throw new BadRequestException("Username or email already exists");
    }

    Role.RoleName roleName = Role.RoleName.valueOf(request.getRole());
    Role role = roleRepository.findByName(roleName)
        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRole()));

    User user = new User();
    user.setUsername(request.getUsername());
    user.setEmail(request.getPersonalDetails().getEmail());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setIsActive(true);
    user.setIsEmailVerified(true);
    user.setIsProfileComplete(true);
    user.setMustResetPassword(false);

    // ✅ FIX: mutable collection
    user.getRoles().add(role);

    user = userRepository.save(user);

    Profile profile = new Profile();
    profile.setUser(user);
    profile.setFirstName(request.getPersonalDetails().getFirstName());
    profile.setLastName(request.getPersonalDetails().getLastName());
    profile.setPhoneNumber(request.getPersonalDetails().getPhone());
    profile.setGender(Profile.Gender.valueOf(request.getPersonalDetails().getGender()));

    if (request.getPersonalDetails().getMaritalStatus() != null) {
      profile.setMaritalStatus(
          Profile.MaritalStatus.valueOf(request.getPersonalDetails().getMaritalStatus())
      );
    }

    Address address = new Address();
    address.setProfile(profile);
    address.setStreet(request.getAddress().getStreet());
    address.setCity(request.getAddress().getCity());
    address.setState(request.getAddress().getState());
    address.setPincode(request.getAddress().getPincode());
    address.setCountry("India");
    profile.setAddress(address);

    for (var acadReq : request.getAcademicInfoList()) {
      AcademicInfo acad = new AcademicInfo();
      acad.setProfile(profile);
      acad.setInstitutionName(acadReq.getInstitutionName());
      acad.setDegree(acadReq.getDegree());
      acad.setGrade(acadReq.getGrade());
      acad.setGradePercentage(acadReq.getGradeInPercentage());
      acad.setEndDate(LocalDate.of(acadReq.getPassingYear(), 12, 31));
      profile.getAcademicInformation().add(acad);
    }

    if (request.getWorkExperienceList() != null) {
      for (var workReq : request.getWorkExperienceList()) {
        WorkExperience work = new WorkExperience();
        work.setProfile(profile);
        work.setCompanyName(workReq.getCompanyName());
        work.setDesignation(workReq.getDesignation());
        work.setPosition(workReq.getDesignation());
        work.setStartDate(workReq.getStartDate());
        work.setEndDate(workReq.getEndDate());
        work.setIsCurrent(workReq.getCurrentlyWorking());

        if (workReq.getCtc() != null) {
          work.setCtcAmount(workReq.getCtc().getAmount());
          work.setCtcCurrency(workReq.getCtc().getCurrency());
        }

        profile.getWorkExperiences().add(work);
      }
    }

    user.setProfile(profile);
    userRepository.save(user);

    emailService.sendComprehensiveRegistrationSuccess(user.getEmail(), user.getUsername());

    return RegisterResponse.builder()
        .message("User registered successfully with complete profile!")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .role(request.getRole())
        .emailVerified(true)
        .profileCompleted(true)
        .profileCompletionPercentage(100)
        .build();
  }

  // ================= LOGIN =================

  @Override
  @Transactional
  public AuthResponse login(LoginRequest request) {

    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new BadRequestException("Invalid credentials"));

    if (!user.getIsActive()) {
      throw new BadRequestException("Account is deactivated");
    }

    // Allow admin users to bypass email verification
    boolean isAdmin = user.getRoles().stream()
        .anyMatch(role -> role.getName() == Role.RoleName.ADMIN);
    
    if (!isAdmin && !user.getIsEmailVerified()) {
      throw new BadRequestException("Please verify your email before logging in");
    }

    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
    );

    SecurityContextHolder.getContext().setAuthentication(authentication);

    String accessToken = jwtUtil.generateToken(authentication);
    String refreshToken = jwtUtil.generateRefreshToken(authentication);

    return AuthResponse.builder()
        .token(accessToken)
        .refreshToken(refreshToken)
        .tokenType("Bearer")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .roles(user.getRoles().stream().map(r -> "ROLE_" + r.getName().name()).toList())
        .isEmailVerified(user.getIsEmailVerified())
        .mustResetPassword(user.getMustResetPassword())
        .isProfileComplete(user.getIsProfileComplete())
        .profileCompletionPercentage(user.getProfileCompletionPercentage())
        .message("Login successful")
        .build();
  }

  // ================= EMAIL VERIFICATION =================

  @Override
  @Transactional
  public void verifyEmail(String token) {

    EmailVerificationToken verificationToken =
        emailVerificationTokenRepository.findByToken(token)
            .orElseThrow(() -> new BadRequestException("Invalid verification token"));

    if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new BadRequestException("Verification token expired");
    }

    User user = verificationToken.getUser();
    user.setIsEmailVerified(true);
    userRepository.save(user);

    emailVerificationTokenRepository.delete(verificationToken);
  }

  @Override
  @Transactional
  public void resendVerificationEmail(String email) {

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

    if (user.getIsEmailVerified()) {
      throw new BadRequestException("Email already verified");
    }

    emailVerificationTokenRepository.deleteByUser(user);

    EmailVerificationToken token = new EmailVerificationToken();
    token.setToken(UUID.randomUUID().toString());
    token.setUser(user);
    token.setExpiresAt(LocalDateTime.now().plusHours(24));
    emailVerificationTokenRepository.save(token);

    emailService.sendVerificationEmail(user.getEmail(), token.getToken(), null);
  }

  // ================= PASSWORD RESET =================

  @Override
  @Transactional
  public void forgotPassword(String email) {

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

    passwordResetTokenRepository.deleteByUser(user);

    PasswordResetToken token = new PasswordResetToken();
    token.setToken(UUID.randomUUID().toString());
    token.setUser(user);
    token.setExpiresAt(LocalDateTime.now().plusHours(1));
    passwordResetTokenRepository.save(token);

    emailService.sendPasswordResetEmail(user.getEmail(), token.getToken());
  }

  @Override
  @Transactional
  public void resetPassword(String token, ResetPasswordRequest request) {

    PasswordResetToken resetToken =
        passwordResetTokenRepository.findByToken(token)
            .orElseThrow(() -> new BadRequestException("Invalid reset token"));

    if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new BadRequestException("Reset token expired");
    }

    User user = resetToken.getUser();
    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    user.setMustResetPassword(false);
    userRepository.save(user);

    passwordResetTokenRepository.delete(resetToken);
  }

  // ================= CHANGE PASSWORD =================

  @Override
  @Transactional
  public void changePassword(String username, String oldPassword, String newPassword) {

    User user = userRepository.findByEmail(username)
        .orElseThrow(() -> new ResourceNotFoundException("User", "email", username));

    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
      throw new BadRequestException("Current password is incorrect");
    }

    user.setPassword(passwordEncoder.encode(newPassword));
    user.setMustResetPassword(false);
    userRepository.save(user);
  }

  // ================= REFRESH TOKEN =================

  @Override
  public AuthResponse refreshToken(String refreshToken) {

    if (!jwtUtil.validateToken(refreshToken)) {
      throw new BadRequestException("Invalid refresh token");
    }

    String username = jwtUtil.extractUsername(refreshToken);

    User user = userRepository.findByEmail(username)
        .orElseThrow(() -> new ResourceNotFoundException("User", "email", username));

    Authentication authentication = new UsernamePasswordAuthenticationToken(
        username,
        null,
        user.getRoles().stream()
            .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                "ROLE_" + r.getName().name()))
            .toList()
    );

    String newAccessToken = jwtUtil.generateToken(authentication);

    return AuthResponse.builder()
        .token(newAccessToken)
        .refreshToken(refreshToken)
        .tokenType("Bearer")
        .email(user.getEmail())
        .message("Token refreshed successfully")
        .build();
  }
}
