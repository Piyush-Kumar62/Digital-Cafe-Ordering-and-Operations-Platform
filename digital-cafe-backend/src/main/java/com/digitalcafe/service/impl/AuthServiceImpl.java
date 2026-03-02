package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.*;
import com.digitalcafe.dto.response.AuthResponse;
import com.digitalcafe.dto.response.RegisterResponse;
import com.digitalcafe.entity.*;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.repository.*;
import com.digitalcafe.security.UserAccessPolicy;
import com.digitalcafe.security.JwtUtil;
import com.digitalcafe.service.AuthService;
import com.digitalcafe.service.AdminProfileService;
import com.digitalcafe.service.DocumentStorageService;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.util.PasswordGenerator;
import com.digitalcafe.websocket.RealtimeNotification;
import com.digitalcafe.websocket.WebSocketNotificationService;
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
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final CafeRepository cafeRepository;
  private final EmailVerificationTokenRepository emailVerificationTokenRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtUtil jwtUtil;
  private final EmailService emailService;
  private final DocumentStorageService documentStorageService;
  private final AdminProfileService adminProfileService;
  private final UserAccessPolicy userAccessPolicy;
  private final WebSocketNotificationService webSocketNotificationService;

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
    user.setDisplayName(request.getUsername());
    user.setPassword(passwordEncoder.encode(tempPassword));
    user.setIsActive(true);
    user.setIsEmailVerified(false);
    user.setIsProfileComplete(false);
    user.setMustResetPassword(true);
    user.setIsTempPassword(true);

    user.getRoles().add(customerRole);

    user = userRepository.save(user);

    EmailVerificationToken token = new EmailVerificationToken();
    token.setToken(UUID.randomUUID().toString());
    token.setUser(user);
    token.setExpiresAt(LocalDateTime.now().plusHours(24));
    emailVerificationTokenRepository.save(token);

    emailService.sendVerificationEmail(user.getEmail(), token.getToken(), tempPassword);
    webSocketNotificationService.notifyAdmins(RealtimeNotification.builder()
        .type("USER_REGISTERED")
        .title("New Customer Signup")
        .message("A new customer registered: " + user.getEmail())
        .severity("info")
        .entityType("USER")
        .entityId(user.getId())
        .timestamp(LocalDateTime.now())
        .build());

    return AuthResponse.builder()
        .message("Registration successful. Please check your email to verify your account.")
        .email(user.getEmail())
        .build();
  }

  @Override
  @Transactional
  public RegisterResponse comprehensiveRegister(RegisterRequest request) {
    return comprehensiveRegisterInternal(request, null);
  }

  @Override
  @Transactional
  public RegisterResponse comprehensiveRegisterWithGovtId(RegisterRequest request, MultipartFile govtIdProof) {
    return comprehensiveRegisterInternal(request, govtIdProof);
  }

  private RegisterResponse comprehensiveRegisterInternal(RegisterRequest request, MultipartFile govtIdProof) {
    if (userRepository.existsByEmail(request.getPersonalDetails().getEmail())
        || userRepository.existsByUsername(request.getUsername())) {
      throw new BadRequestException("Username or email already exists");
    }

    Role.RoleName roleName;
    try {
      roleName = Role.RoleName.valueOf(request.getRole().trim().toUpperCase());
    } catch (Exception ex) {
      throw new BadRequestException("Only CUSTOMER role is allowed for public registration");
    }
    if (roleName != Role.RoleName.CUSTOMER) {
      throw new BadRequestException("Only CUSTOMER role is allowed for public registration");
    }
    Role role = roleRepository.findByName(roleName)
        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRole()));

    String tempPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 12) + "Aa1!";

    User user = new User();
    user.setUsername(request.getUsername());
    user.setEmail(request.getPersonalDetails().getEmail());
    user.setFirstName(request.getPersonalDetails().getFirstName());
    user.setLastName(request.getPersonalDetails().getLastName());
    user.setDisplayName(
        (request.getPersonalDetails().getFirstName() + " " + request.getPersonalDetails().getLastName()).trim()
    );
    user.setPassword(passwordEncoder.encode(tempPassword));
    user.setIsActive(false);
    user.setIsEmailVerified(false);
    user.setIsProfileComplete(false);
    user.setMustResetPassword(true);
    user.setIsTempPassword(true);
    user.setRegistrationStatus(User.RegistrationStatus.PENDING_APPROVAL);

    user.getRoles().add(role);

    user = userRepository.save(user);

    Profile profile = new Profile();
    profile.setUser(user);
    profile.setFirstName(request.getPersonalDetails().getFirstName());
    profile.setLastName(request.getPersonalDetails().getLastName());
    profile.setDateOfBirth(request.getPersonalDetails().getDateOfBirth());
    profile.setPhoneNumber(request.getPersonalDetails().getPhone());
    profile.setGender(Profile.Gender.valueOf(request.getPersonalDetails().getGender()));
    profile.setGovtIdType(request.getGovtIdType());

    if (request.getPersonalDetails().getMaritalStatus() != null) {
      profile.setMaritalStatus(
          Profile.MaritalStatus.valueOf(request.getPersonalDetails().getMaritalStatus())
      );
    }

    Address address = new Address();
    address.setProfile(profile);
    address.setStreet(request.getAddress().getStreet());
    address.setPlotNumber(request.getAddress().getPlotNumber());
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

    if (govtIdProof != null && !govtIdProof.isEmpty()) {
      DocumentStorageService.StoredDocument storedDocument = documentStorageService.storeGovtIdProof(govtIdProof);
      profile.setGovtIdFileName(storedDocument.fileName());
      profile.setGovtIdContentType(storedDocument.contentType());
      profile.setGovtIdDocumentPath(storedDocument.storedPath());
      profile.setGovtIdFileSize(storedDocument.size());
    }

    user.setProfile(profile);
    int completionPercentage = profile.calculateCompletionPercentage();
    user.setProfileCompletionPercentage(completionPercentage);
    user.setIsProfileComplete(profile.isComplete());
    userRepository.save(user);

    EmailVerificationToken verificationToken = new EmailVerificationToken();
    verificationToken.setToken(UUID.randomUUID().toString());
    verificationToken.setUser(user);
    verificationToken.setExpiresAt(LocalDateTime.now().plusHours(24));
    emailVerificationTokenRepository.save(verificationToken);

    PasswordResetToken passwordResetToken = new PasswordResetToken();
    passwordResetToken.setToken(UUID.randomUUID().toString());
    passwordResetToken.setUser(user);
    passwordResetToken.setExpiresAt(LocalDateTime.now().plusHours(24));
    passwordResetTokenRepository.save(passwordResetToken);

    emailService.sendVerificationEmail(user.getEmail(), verificationToken.getToken(), tempPassword);
    emailService.sendWelcomeEmail(user.getEmail(), user.getUsername(), tempPassword);
    emailService.sendPasswordResetEmail(user.getEmail(), passwordResetToken.getToken());
    webSocketNotificationService.notifyAdmins(RealtimeNotification.builder()
        .type("REGISTRATION_PENDING")
        .title("Registration Pending Approval")
        .message("New customer application pending: " + user.getEmail())
        .severity("warning")
        .entityType("USER")
        .entityId(user.getId())
        .timestamp(LocalDateTime.now())
        .build());

    return RegisterResponse.builder()
        .message("Registration successful. Awaiting admin approval.")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .role(request.getRole())
        .emailVerified(false)
        .profileCompleted(user.getIsProfileComplete())
        .profileCompletionPercentage(user.getProfileCompletionPercentage())
        .build();
  }

  @Override
  @Transactional
  public AuthResponse login(LoginRequest request) {

    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new BadRequestException("Invalid credentials"));

    if (!user.getIsActive()) {
      throw new BadRequestException("Account is disabled. Awaiting admin approval");
    }

    // Backward compatibility: existing users created before approval workflow may have null status.
    if (user.getRegistrationStatus() != null && user.getRegistrationStatus() != User.RegistrationStatus.APPROVED) {
      throw new BadRequestException("Registration is not approved yet");
    }

    if (userAccessPolicy.isSystemAdmin(user)) {
      user.setIsEmailVerified(true);
      user.setEmailVerified(true);
      user.setAccountStatus(User.AccountStatus.ACTIVE);
      user.setIsActive(true);
    }

    if (userAccessPolicy.requiresEmailVerification(user) && !user.getIsEmailVerified()) {
      throw new BadRequestException("Please verify your email before logging in");
    }

    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
    );

    SecurityContextHolder.getContext().setAuthentication(authentication);

    adminProfileService.markLastLoginAndBroadcast(user.getId());

    String accessToken = jwtUtil.generateToken(authentication);
    String refreshToken = jwtUtil.generateRefreshToken(authentication);

    return AuthResponse.builder()
        .token(accessToken)
        .refreshToken(refreshToken)
        .tokenType("Bearer")
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .cafeId(resolveCafeId(user))
        .roles(user.getRoles().stream().map(r -> "ROLE_" + r.getName().name()).toList())
        .isEmailVerified(user.getIsEmailVerified())
        .mustResetPassword(user.getMustResetPassword())
        .isProfileComplete(user.getIsProfileComplete())
        .profileCompletionPercentage(user.getProfileCompletionPercentage())
        .message("Login successful")
        .build();
  }

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
    if (userAccessPolicy.isSystemAdmin(user)) {
      emailVerificationTokenRepository.delete(verificationToken);
      return;
    }
    user.setIsEmailVerified(true);
    userRepository.save(user);

    emailVerificationTokenRepository.delete(verificationToken);

    // For simple-registered users (registrationStatus == null → no admin-approval required),
    // they are now fully active. Send them a "you're all set" confirmation.
    if (user.getRegistrationStatus() == null
        || user.getRegistrationStatus() == User.RegistrationStatus.APPROVED) {
      String displayName = (user.getDisplayName() != null && !user.getDisplayName().isBlank())
          ? user.getDisplayName() : user.getUsername();
      emailService.sendComprehensiveRegistrationSuccess(user.getEmail(), displayName);
    }
  }

  @Override
  @Transactional
  public void resendVerificationEmail(String email) {

    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

    if (userAccessPolicy.isSystemAdmin(user)) {
      throw new BadRequestException("Email verification flow is not applicable for admin");
    }

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

    if (!request.getNewPassword().equals(request.getConfirmPassword())) {
      throw new BadRequestException("New password and confirm password do not match");
    }

    User user = resetToken.getUser();
    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    user.setMustResetPassword(false);
    user.setIsTempPassword(false);
    userRepository.save(user);

    passwordResetTokenRepository.delete(resetToken);
    emailService.sendPasswordChangedNotification(user.getEmail());
  }

  @Override
  @Transactional
  public void changePassword(String username, String oldPassword, String newPassword) {

    User user = userRepository.findByEmail(username)
        .orElseThrow(() -> new ResourceNotFoundException("User", "email", username));

    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
      throw new BadRequestException("Current password is incorrect");
    }

    if (passwordEncoder.matches(newPassword, user.getPassword())) {
      throw new BadRequestException("New password must be different from current password");
    }

    user.setPassword(passwordEncoder.encode(newPassword));
    user.setMustResetPassword(false);
    user.setIsTempPassword(false);
    userRepository.save(user);
    emailService.sendPasswordChangedNotification(user.getEmail());
  }

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
        .userId(user.getId())
        .username(user.getUsername())
        .email(user.getEmail())
        .cafeId(resolveCafeId(user))
        .roles(user.getRoles().stream().map(r -> "ROLE_" + r.getName().name()).toList())
        .isEmailVerified(user.getIsEmailVerified())
        .mustResetPassword(user.getMustResetPassword())
        .isProfileComplete(user.getIsProfileComplete())
        .profileCompletionPercentage(user.getProfileCompletionPercentage())
        .message("Token refreshed successfully")
        .build();
  }

  private Long resolveCafeId(User user) {
    if (user.getCafe() != null) {
      return user.getCafe().getId();
    }
    if (user.hasRole(Role.RoleName.CAFE_OWNER)) {
      return cafeRepository.findByOwnerId(user.getId()).stream()
          .findFirst()
          .map(Cafe::getId)
          .orElse(null);
    }
    return null;
  }
}
