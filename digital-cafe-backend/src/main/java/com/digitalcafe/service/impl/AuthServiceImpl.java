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
import com.digitalcafe.storage.FileStorageService;
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
import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private static final String USERNAME_REGEX = "^[A-Za-z][A-Za-z0-9._]{2,29}$";
  private static final java.util.Set<String> RESERVED_USERNAMES = java.util.Set.of(
      "admin", "administrator", "root", "system", "support", "help", "owner",
      "staff", "chef", "waiter", "customer", "api", "auth", "login", "signup",
      "register", "security", "null", "undefined"
  );

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final CafeRepository cafeRepository;
  private final CafeGalleryRepository cafeGalleryRepository;
  private final EmailVerificationTokenRepository emailVerificationTokenRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtUtil jwtUtil;
  private final EmailService emailService;
  private final DocumentStorageService documentStorageService;
  private final AdminProfileService adminProfileService;
  private final FileStorageService fileStorageService;
  private final UserAccessPolicy userAccessPolicy;
  private final WebSocketNotificationService webSocketNotificationService;

  @Override
  @Transactional
  public AuthResponse register(SimpleRegisterRequest request) {
    String normalizedUsername = normalizeUsername(request.getUsername());
    validateUsernameOrThrow(normalizedUsername);
    if (userRepository.existsByUsernameIgnoreCase(normalizedUsername))
      throw new BadRequestException("Username already exists");
    if (userRepository.existsByEmail(request.getEmail()))
      throw new BadRequestException("Email already registered");
    Role customerRole = roleRepository.findByName(Role.RoleName.CUSTOMER)
        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "CUSTOMER"));
    String tempPassword = PasswordGenerator.generateTemporaryPassword();
    User user = new User();
    user.setEmail(request.getEmail()); user.setUsername(normalizedUsername);
    user.setDisplayName(request.getUsername());
    user.setPassword(passwordEncoder.encode(tempPassword));
    user.setIsActive(true); user.setIsEmailVerified(false); user.setIsProfileComplete(false);
    user.setMustResetPassword(true); user.setIsTempPassword(true);
    user.getRoles().add(customerRole);
    user = saveUserOrThrow(user);
    String verificationTokenStr = saveVerificationToken(user);
    emailService.sendVerificationEmail(user.getEmail(), verificationTokenStr, tempPassword);
    notifyAdmins("USER_REGISTERED", "New Customer Signup", "A new customer registered: " + user.getEmail(), "info", user.getId());
    return AuthResponse.builder()
        .message("Registration successful. Please check your email to verify your account.")
        .email(user.getEmail()).build();
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
  @Override
  @Transactional
  public AuthResponse registerCafeOwner(CafeOwnerRegisterRequest request, MultipartFile logo, List<MultipartFile> galleryImages) {
    if (userRepository.existsByEmail(request.getEmail()))
      throw new BadRequestException("Email already registered");
    Role cafeOwnerRole = roleRepository.findByName(Role.RoleName.CAFE_OWNER)
        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "CAFE_OWNER"));
    String tempPassword = PasswordGenerator.generateTemporaryPassword();
    User user = saveUserOrThrow(buildOwnerUser(request, tempPassword, cafeOwnerRole));
    String logoUrl = (logo != null && !logo.isEmpty()) ? fileStorageService.storeMenuItemImage(logo) : null;
    Cafe savedCafe = cafeRepository.save(buildCafe(request, user, logoUrl));
    persistCafeGallery(savedCafe, galleryImages);
    String verificationTokenStr = saveVerificationToken(user);
    emailService.sendVerificationEmail(user.getEmail(), verificationTokenStr, tempPassword);
    notifyAdmins("CAFE_OWNER_REGISTERED", "New Café Owner Registration",
        "Café owner registered: " + user.getEmail() + "  |  Café: " + request.getCafeName(), "info", user.getId());
    return AuthResponse.builder()
        .message("Registration successful! Please verify your email. Your account and café will be activated after admin review.")
        .email(user.getEmail()).build();
  }
  private RegisterResponse comprehensiveRegisterInternal(RegisterRequest request, MultipartFile govtIdProof) {
    String normalizedUsername = normalizeUsername(request.getUsername());
    validateUsernameOrThrow(normalizedUsername);
    if (userRepository.existsByEmail(request.getPersonalDetails().getEmail())
        || userRepository.existsByUsernameIgnoreCase(normalizedUsername))
      throw new BadRequestException("Username or email already exists");
    Role.RoleName roleName;
    try {
      roleName = Role.RoleName.valueOf(request.getRole().trim().toUpperCase());
    } catch (Exception ex) {
      throw new BadRequestException("Only CUSTOMER role is allowed for public registration");
    }
    if (roleName != Role.RoleName.CUSTOMER)
      throw new BadRequestException("Only CUSTOMER role is allowed for public registration");
    Role role = roleRepository.findByName(roleName)
        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRole()));
    String tempPassword = UUID.randomUUID().toString().replace("-", "").substring(0, 12) + "Aa1!";
    User user = saveUserOrThrow(buildUserForComprehensiveReg(request, role, tempPassword, normalizedUsername));
    Profile profile = buildProfile(request, user);
    profile.setAddress(buildAddress(request, profile));
    addAcademicInfo(request, profile);
    addWorkExperience(request, profile);
    if (govtIdProof != null && !govtIdProof.isEmpty()) attachGovtId(profile, govtIdProof);
    user.setProfile(profile);
    user.setProfileCompletionPercentage(profile.calculateCompletionPercentage());
    user.setIsProfileComplete(profile.isComplete());
    userRepository.save(user);
    sendComprehensiveRegistrationEmails(user, tempPassword);
    return RegisterResponse.builder()
        .message("Registration successful. Awaiting admin approval.")
        .userId(user.getId()).username(user.getUsername()).email(user.getEmail())
        .role(request.getRole()).emailVerified(false).profileCompleted(user.getIsProfileComplete())
        .profileCompletionPercentage(user.getProfileCompletionPercentage()).build();
  }

  @Override
  @Transactional
  public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new BadRequestException("Invalid credentials"));
    validateLoginEligibility(user);
    Authentication authentication;
    try {
      authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
      );
    } catch (Exception ex) {
      log.warn("security_error=LOGIN_FAILED userId={} email={} message={}", user.getId(), user.getEmail(), ex.getMessage());
      throw ex;
    }
    SecurityContextHolder.getContext().setAuthentication(authentication);
    adminProfileService.markLastLoginAndBroadcast(user.getId());
    String displayName = resolveDisplayName(user);
    String loginTime = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")
        .withZone(java.time.ZoneId.systemDefault()).format(java.time.Instant.now());
    emailService.sendLoginNotification(user.getEmail(), displayName, loginTime);
    log.info("security_event=LOGIN_SUCCESS userId={} email={}", user.getId(), user.getEmail());
    return buildAuthResponse(user, jwtUtil.generateToken(authentication),
        jwtUtil.generateRefreshToken(authentication), "Login successful");
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
      String displayName = resolveDisplayName(user);
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
    if (!jwtUtil.validateToken(refreshToken))
      throw new BadRequestException("Invalid refresh token");
    String username = jwtUtil.extractUsername(refreshToken);
    User user = userRepository.findByEmail(username)
        .orElseThrow(() -> new ResourceNotFoundException("User", "email", username));
    Authentication authentication = new UsernamePasswordAuthenticationToken(
        username, null,
        user.getRoles().stream()
            .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + r.getName().name()))
            .toList()
    );
    return buildAuthResponse(user, jwtUtil.generateToken(authentication), refreshToken, "Token refreshed successfully");
  }

  private String saveVerificationToken(User user) {
    EmailVerificationToken token = new EmailVerificationToken();
    token.setToken(UUID.randomUUID().toString());
    token.setUser(user);
    token.setExpiresAt(LocalDateTime.now().plusHours(24));
    emailVerificationTokenRepository.save(token);
    return token.getToken();
  }

  private void notifyAdmins(String type, String title, String message, String severity, Long entityId) {
    webSocketNotificationService.notifyAdmins(RealtimeNotification.builder()
        .type(type).title(title).message(message).severity(severity)
        .entityType("USER").entityId(entityId).timestamp(LocalDateTime.now()).build());
  }

  private void validateLoginEligibility(User user) {
    if (!user.getIsActive()) {
      log.warn("security_error=LOGIN_BLOCKED userId={} email={} reason=ACCOUNT_DISABLED", user.getId(), user.getEmail());
      throw new BadRequestException("Account is disabled. Awaiting admin approval");
    }
    if (user.getRegistrationStatus() != null && user.getRegistrationStatus() != User.RegistrationStatus.APPROVED) {
      log.warn("security_error=LOGIN_BLOCKED userId={} email={} reason=REGISTRATION_NOT_APPROVED", user.getId(), user.getEmail());
      throw new BadRequestException("Registration is not approved yet");
    }
    if (userAccessPolicy.isSystemAdmin(user)) {
      user.setIsEmailVerified(true); user.setEmailVerified(true);
      user.setAccountStatus(User.AccountStatus.ACTIVE); user.setIsActive(true);
    }
    if (userAccessPolicy.requiresEmailVerification(user) && !user.getIsEmailVerified()) {
      log.warn("security_error=LOGIN_BLOCKED userId={} email={} reason=EMAIL_NOT_VERIFIED", user.getId(), user.getEmail());
      throw new BadRequestException("Please verify your email before logging in");
    }
  }

  private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken, String message) {
    return AuthResponse.builder()
        .token(accessToken).refreshToken(refreshToken).tokenType("Bearer")
        .userId(user.getId()).username(user.getUsername()).email(user.getEmail())
        .firstName(user.getFirstName()).lastName(user.getLastName()).cafeId(resolveCafeId(user))
        .roles(user.getRoles().stream().map(r -> "ROLE_" + r.getName().name()).toList())
        .isEmailVerified(user.getIsEmailVerified()).mustResetPassword(user.getMustResetPassword())
        .isProfileComplete(user.getIsProfileComplete())
        .profileCompletionPercentage(user.getProfileCompletionPercentage())
        .message(message).build();
  }

  private User buildOwnerUser(CafeOwnerRegisterRequest request, String tempPassword, Role role) {
    User user = new User();
    user.setEmail(request.getEmail()); user.setUsername(request.getEmail());
    user.setFirstName(request.getFirstName()); user.setLastName(request.getLastName());
    user.setDisplayName((request.getFirstName() + " " + request.getLastName()).trim());
    user.setPassword(passwordEncoder.encode(tempPassword));
    user.setIsActive(false); user.setIsEmailVerified(false); user.setIsProfileComplete(true);
    user.setProfileCompletionPercentage(100); user.setMustResetPassword(true); user.setIsTempPassword(true);
    user.setRegistrationStatus(User.RegistrationStatus.PENDING_APPROVAL);
    if (request.getOwnerPhoneNumber() != null && !request.getOwnerPhoneNumber().isBlank())
      user.setPhoneNumber(request.getOwnerPhoneNumber());
    user.getRoles().add(role);
    Profile profile = new Profile();
    profile.setUser(user);
    profile.setFirstName(request.getFirstName());
    profile.setLastName(request.getLastName());
    if (request.getOwnerPhoneNumber() != null && !request.getOwnerPhoneNumber().isBlank()) {
      profile.setPhoneNumber(request.getOwnerPhoneNumber());
    }
    user.setProfile(profile);
    return user;
  }

  private Cafe buildCafe(CafeOwnerRegisterRequest request, User owner, String logoUrl) {
    Cafe cafe = new Cafe();
    cafe.setName(request.getCafeName()); cafe.setDescription(request.getDescription());
    cafe.setAddress(request.getAddress()); cafe.setCity(request.getCity()); cafe.setState(request.getState());
    cafe.setPincode(request.getPincode()); cafe.setPhoneNumber(request.getPhoneNumber());
    cafe.setOpenTime(request.getOpenTime()); cafe.setCloseTime(request.getCloseTime());
    cafe.setFssaiNumber(normalizeDigits(request.getFssaiNumber()));
    cafe.setGstNumber(normalizeUpper(request.getGstNumber()));
    cafe.setMsmeNumber(normalizeUpper(request.getMsmeNumber()));
    cafe.setIsActive(false); cafe.setOwner(owner);
    if (logoUrl != null) cafe.setLogoUrl(logoUrl);
    return cafe;
  }

  private void persistCafeGallery(Cafe cafe, List<MultipartFile> galleryImages) {
    if (galleryImages == null || galleryImages.isEmpty()) {
      return;
    }

    int displayOrder = 0;
    for (MultipartFile file : galleryImages) {
      if (file == null || file.isEmpty()) {
        continue;
      }
      String imageUrl = fileStorageService.storeMenuItemImage(file);
      CafeGallery gallery = CafeGallery.builder()
          .cafe(cafe)
          .imageUrl(imageUrl)
          .displayOrder(displayOrder++)
          .build();
      cafeGalleryRepository.save(gallery);
    }
  }

  private String normalizeUpper(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed.toUpperCase();
  }

  private String normalizeDigits(String value) {
    if (value == null) {
      return null;
    }
    String digits = value.replaceAll("\\D", "");
    return digits.isEmpty() ? null : digits;
  }

  private User buildUserForComprehensiveReg(RegisterRequest request, Role role, String tempPassword, String normalizedUsername) {
    User user = new User();
    user.setUsername(normalizedUsername); user.setEmail(request.getPersonalDetails().getEmail());
    user.setFirstName(request.getPersonalDetails().getFirstName());
    user.setLastName(request.getPersonalDetails().getLastName());
    user.setDisplayName((request.getPersonalDetails().getFirstName() + " " + request.getPersonalDetails().getLastName()).trim());
    user.setPassword(passwordEncoder.encode(tempPassword));
    user.setIsActive(false); user.setIsEmailVerified(false); user.setIsProfileComplete(false);
    user.setMustResetPassword(true); user.setIsTempPassword(true);
    user.setRegistrationStatus(User.RegistrationStatus.PENDING_APPROVAL);
    user.getRoles().add(role);
    return user;
  }

  private Profile buildProfile(RegisterRequest request, User user) {
    Profile profile = new Profile();
    profile.setUser(user);
    profile.setFirstName(request.getPersonalDetails().getFirstName());
    profile.setLastName(request.getPersonalDetails().getLastName());
    profile.setDateOfBirth(request.getPersonalDetails().getDateOfBirth());
    profile.setPhoneNumber(request.getPersonalDetails().getPhone());
    profile.setGender(Profile.Gender.valueOf(request.getPersonalDetails().getGender()));
    profile.setGovtIdType(request.getGovtIdType());
    profile.setGovtIdNumber(request.getGovtIdNumber());
    if (request.getPersonalDetails().getMaritalStatus() != null)
      profile.setMaritalStatus(Profile.MaritalStatus.valueOf(request.getPersonalDetails().getMaritalStatus()));
    return profile;
  }

  private String resolveDisplayName(User user) {
    if (user == null) {
      return "there";
    }
    if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
      return user.getDisplayName().trim();
    }
    String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
    String last = user.getLastName() == null ? "" : user.getLastName().trim();
    String full = (first + " " + last).trim();
    if (!full.isBlank()) {
      return full;
    }
    if (user.getUsername() != null && !user.getUsername().isBlank()) {
      return user.getUsername().trim();
    }
    if (user.getEmail() != null && !user.getEmail().isBlank()) {
      return user.getEmail().trim();
    }
    return "there";
  }

  @Override
  public boolean isUsernameAvailable(String username) {
    String normalized = normalizeUsername(username);
    if (normalized.isBlank()) {
      return false;
    }
    if (!normalized.matches(USERNAME_REGEX)) {
      return false;
    }
    if (RESERVED_USERNAMES.contains(normalized)) {
      return false;
    }
    return !userRepository.existsByUsernameIgnoreCase(normalized);
  }

  private Address buildAddress(RegisterRequest request, Profile profile) {
    Address address = new Address();
    address.setProfile(profile);
    address.setStreet(request.getAddress().getStreet());
    address.setPlotNumber(request.getAddress().getPlotNumber());
    address.setCity(request.getAddress().getCity());
    address.setState(request.getAddress().getState());
    address.setPincode(request.getAddress().getPincode());
    address.setCountry("India");
    return address;
  }

  private void addAcademicInfo(RegisterRequest request, Profile profile) {
    for (var acadReq : request.getAcademicInfoList()) {
      AcademicInfo acad = new AcademicInfo();
      acad.setProfile(profile); acad.setInstitutionName(acadReq.getInstitutionName());
      acad.setInstitutionId(acadReq.getInstitutionId());
      acad.setDegree(acadReq.getDegree()); acad.setGrade(acadReq.getGrade());
      acad.setGradePercentage(acadReq.getGradeInPercentage());
      if (acadReq.getBranch() != null && !acadReq.getBranch().isBlank()) {
        acad.setFieldOfStudy(acadReq.getBranch());
      }
      acad.setEndDate(LocalDate.of(acadReq.getPassingYear(), 12, 31));
      profile.getAcademicInformation().add(acad);
    }
  }

  private void addWorkExperience(RegisterRequest request, Profile profile) {
    if (request.getWorkExperienceList() == null) return;
    for (var workReq : request.getWorkExperienceList()) {
      WorkExperience work = new WorkExperience();
      work.setProfile(profile); work.setCompanyName(workReq.getCompanyName());
      work.setDesignation(workReq.getDesignation()); work.setPosition(workReq.getDesignation());
      work.setStartDate(workReq.getStartDate()); work.setEndDate(workReq.getEndDate());
      work.setIsCurrent(workReq.getCurrentlyWorking());
      if (workReq.getCtc() != null) {
        work.setCtcAmount(workReq.getCtc().getAmount()); work.setCtcCurrency(workReq.getCtc().getCurrency());
      }
      profile.getWorkExperiences().add(work);
    }
  }

  private void attachGovtId(Profile profile, MultipartFile govtIdProof) {
    DocumentStorageService.StoredDocument doc = documentStorageService.storeGovtIdProof(govtIdProof);
    profile.setGovtIdFileName(doc.fileName());
    profile.setGovtIdContentType(doc.contentType());
    profile.setGovtIdDocumentPath(doc.storedPath());
    profile.setGovtIdFileSize(doc.size());
  }

  private void sendComprehensiveRegistrationEmails(User user, String tempPassword) {
    String verificationTokenStr = saveVerificationToken(user);
    emailService.sendVerificationEmail(user.getEmail(), verificationTokenStr, tempPassword);
    notifyAdmins("REGISTRATION_PENDING", "Registration Pending Approval",
        "New customer application pending: " + user.getEmail(), "warning", user.getId());
  }

  private String normalizeUsername(String username) {
    return username == null ? "" : username.trim().toLowerCase();
  }

  private void validateUsernameOrThrow(String username) {
    if (username.isBlank()) {
      throw new BadRequestException("Username is required");
    }
    if (!username.matches(USERNAME_REGEX)) {
      throw new BadRequestException(
          "Username must start with a letter and contain only letters, numbers, dots, and underscores");
    }
    if (RESERVED_USERNAMES.contains(username)) {
      throw new BadRequestException("Username is not allowed");
    }
  }

  private User saveUserOrThrow(User user) {
    try {
      return userRepository.save(user);
    } catch (org.springframework.dao.DataIntegrityViolationException ex) {
      throw new BadRequestException("Username or email already exists");
    }
  }

  private Long resolveCafeId(User user) {
    if (user.getCafe() != null) {
      return user.getCafe().getId();
    }
    if (user.hasRole(Role.RoleName.CAFE_OWNER)) {
      return cafeRepository.findByOwner(user).stream()
          .findFirst()
          .map(Cafe::getId)
          .orElse(null);
    }
    return null;
  }
}
