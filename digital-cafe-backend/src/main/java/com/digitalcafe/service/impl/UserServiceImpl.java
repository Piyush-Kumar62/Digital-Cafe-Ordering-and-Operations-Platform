package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.CreateStaffRequest;
import com.digitalcafe.dto.request.CreateUserRequest;
import com.digitalcafe.dto.request.PersonalDetailsRequest;
import com.digitalcafe.dto.response.UserResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.Profile;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.AccessDeniedException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.RoleRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.service.UserService;
import com.digitalcafe.util.PasswordGenerator;
import com.digitalcafe.websocket.RealtimeNotification;
import com.digitalcafe.websocket.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CafeRepository cafeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final WebSocketNotificationService webSocketNotificationService;

    @Override
    @Transactional
    public UserResponse createStaffByOwner(CreateStaffRequest request) {

        User currentOwner = getCurrentUserEntity();
        if (!currentOwner.hasRole(Role.RoleName.CAFE_OWNER))
            throw new BadRequestException("Only Cafe Owner can create staff");

        String normalizedRole = request.getRole() == null ? "" : request.getRole().trim().toUpperCase();
        Role.RoleName roleName;
        try {
            roleName = Role.RoleName.valueOf(normalizedRole);
        } catch (Exception e) {
            throw new BadRequestException("Invalid role. Allowed roles: CHEF, WAITER");
        }
        if (roleName != Role.RoleName.CHEF && roleName != Role.RoleName.WAITER)
            throw new BadRequestException("Only CHEF or WAITER can be created");

        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedUsername = normalizeText(request.getUsername());
        String normalizedFirstName = normalizeText(request.getFirstName());
        String normalizedLastName = normalizeText(request.getLastName());

        if (normalizedEmail.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (normalizedUsername.isBlank()) {
            throw new BadRequestException("Username is required");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BadRequestException("Email already exists");
        }

        String resolvedUsername = resolveUniqueStaffUsername(normalizedUsername, normalizedEmail);

        Cafe cafe = resolveAndValidateCafe(currentOwner, request.getCafeId());
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName.name()));
        String tempPassword = PasswordGenerator.generateTemporaryPassword();
        User user = userRepository.save(buildStaffUser(
                cafe,
                currentOwner,
                role,
                request,
                tempPassword,
                resolvedUsername,
                normalizedEmail,
                normalizedFirstName,
                normalizedLastName
        ));
        log.info("{} created by owner {} for cafe {}", roleName, currentOwner.getEmail(), cafe.getName());
        String roleLabel = roleName == Role.RoleName.CHEF ? "Chef" : "Waiter";
        String displayName = (user.getDisplayName() != null && !user.getDisplayName().isBlank())
                ? user.getDisplayName()
                : user.getUsername();
        emailService.sendWelcomeEmail(
                user.getEmail(),
                displayName,
                tempPassword,
                roleName.name(),
                "/" + roleLabel.toLowerCase() + "/dashboard"
        );
        log.info("Staff welcome email queued: role={}, to={}", roleName, user.getEmail());
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, CreateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        user.setEmail(request.getEmail());
        user.setUsername(request.getEmail());

        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        boolean wasActive = Boolean.TRUE.equals(user.getIsActive());
        if (wasActive) {
            log.info("User already active, skipping activation email: {}", user.getEmail());
            return;
        }
        user.setIsActive(true);
        userRepository.save(user);
        log.info("User activated: {}", user.getEmail());
        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName().name())
                .orElse("USER");
        String displayName = (user.getDisplayName() != null && !user.getDisplayName().isBlank())
                ? user.getDisplayName()
                : user.getUsername();
        emailService.sendAccountReactivated(user.getEmail(), displayName, role);
        notifyUserRealtime(user, "ACCOUNT_REACTIVATED", "Account Reactivated",
            "Your account has been reactivated. You can continue using Digital Cafe.", "info");
    }

    @Override
    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        boolean wasActive = Boolean.TRUE.equals(user.getIsActive());
        if (!wasActive) {
            log.info("User already inactive, skipping deactivation email: {}", user.getEmail());
            return;
        }
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getEmail());
        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName().name())
                .orElse("USER");
        String displayName = (user.getDisplayName() != null && !user.getDisplayName().isBlank())
                ? user.getDisplayName()
                : user.getUsername();
        emailService.sendAccountDeactivated(user.getEmail(), displayName, role);
        notifyUserRealtime(user, "ACCOUNT_DEACTIVATED", "Account Deactivated",
            "Your account has been deactivated. Contact admin for assistance.", "warning");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::mapToUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(String roleName) {
        Role.RoleName roleNameEnum = Role.RoleName.valueOf(roleName);
        return userRepository.findByRoleName(roleNameEnum).stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsersByCafe(Long cafeId, Pageable pageable) {
        return userRepository.findByCafeId(cafeId, pageable)
                .map(this::mapToUserResponse);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        userRepository.delete(user);
        log.info("User deleted: {}", user.getEmail());
    }

    @Override
    @Transactional
    public UserResponse toggleUserStatus(Long id, boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        boolean wasActive = Boolean.TRUE.equals(user.getIsActive());
        if (wasActive == isActive) {
            log.info("User {} status unchanged ({}), skipping email notification", user.getEmail(), isActive);
            return mapToUserResponse(user);
        }
        user.setIsActive(isActive);
        userRepository.save(user);
        log.info("User {} status changed to: {}", user.getEmail(), isActive);
        if (isActive) {
            String role = user.getRoles().stream()
                    .findFirst()
                    .map(r -> r.getName().name())
                    .orElse("USER");
            String displayName = (user.getDisplayName() != null && !user.getDisplayName().isBlank())
                    ? user.getDisplayName()
                    : user.getUsername();
            emailService.sendAccountReactivated(user.getEmail(), displayName, role);
                notifyUserRealtime(user, "ACCOUNT_REACTIVATED", "Account Reactivated",
                    "Your account has been reactivated. You can continue using Digital Cafe.", "info");
        } else {
            String role = user.getRoles().stream()
                    .findFirst()
                    .map(r -> r.getName().name())
                    .orElse("USER");
            String displayName = (user.getDisplayName() != null && !user.getDisplayName().isBlank())
                    ? user.getDisplayName()
                    : user.getUsername();
            emailService.sendAccountDeactivated(user.getEmail(), displayName, role);
            notifyUserRealtime(user, "ACCOUNT_DEACTIVATED", "Account Deactivated",
                    "Your account has been deactivated. Contact admin for assistance.", "warning");
        }
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getStaffByCafeId(Long cafeId) {
        List<User> staff = userRepository.findByCafeIdAndRoles(cafeId,
                List.of(Role.RoleName.CHEF, Role.RoleName.WAITER));
        return staff.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getChefsByCafeId(Long cafeId) {
        List<User> chefs = userRepository.findByCafeIdAndRoleName(cafeId, Role.RoleName.CHEF);
        return chefs.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getWaitersByCafeId(Long cafeId) {
        List<User> waiters = userRepository.findByCafeIdAndRoleName(cafeId, Role.RoleName.WAITER);
        return waiters.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getPendingApprovalUsers() {
        return userRepository.findByRegistrationStatus(User.RegistrationStatus.PENDING_APPROVAL).stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        boolean alreadyApproved = user.getRegistrationStatus() == User.RegistrationStatus.APPROVED;
        boolean alreadyActive = Boolean.TRUE.equals(user.getIsActive());
        if (alreadyApproved && alreadyActive) {
            log.info("User already approved/active, skipping approval email: {}", user.getEmail());
            return;
        }
        user.setRegistrationStatus(User.RegistrationStatus.APPROVED);
        user.setIsActive(true);
        userRepository.save(user);
        String displayName = (user.getDisplayName() != null && !user.getDisplayName().isBlank())
                ? user.getDisplayName() : user.getUsername();
        String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName().name())
                .orElse("USER");
        emailService.sendApprovalConfirmationEmail(user.getEmail(), displayName, role);
        notifyUserRealtime(user, "REGISTRATION_APPROVED", "Registration Approved",
            "Your registration has been approved. You can now log in.", "success");
    }

    @Override
    @Transactional
    public void rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        boolean alreadyRejected = user.getRegistrationStatus() == User.RegistrationStatus.REJECTED;
        boolean alreadyInactive = !Boolean.TRUE.equals(user.getIsActive());
        if (alreadyRejected && alreadyInactive) {
            log.info("User already rejected/inactive, skipping rejection email: {}", user.getEmail());
            return;
        }
        user.setRegistrationStatus(User.RegistrationStatus.REJECTED);
        user.setIsActive(false);
        userRepository.save(user);
        emailService.sendRejectionEmail(user.getEmail());
        notifyUserRealtime(user, "REGISTRATION_REJECTED", "Registration Rejected",
                "Your registration request was rejected. Please contact support.", "error");
    }

    private void notifyUserRealtime(User user, String type, String title, String message, String severity) {
        try {
            webSocketNotificationService.notifyUser(
                    user.getId(),
                    RealtimeNotification.builder()
                            .type(type)
                            .title(title)
                            .message(message)
                            .severity(severity)
                            .entityType("USER")
                            .entityId(user.getId())
                            .timestamp(LocalDateTime.now())
                            .build()
            );
        } catch (Exception ex) {
            log.warn("Failed to push realtime user notification: userId={}, type={}, error={}",
                    user.getId(), type, ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        User user = getCurrentUserEntity();
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Long getCurrentUserId() {
        return getCurrentUserEntity().getId();
    }

    @Override
    @Transactional
    public UserResponse updateStaffByOwner(Long staffId, CreateStaffRequest request) {
        User user = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(staffId)) throw new BadRequestException("Email already exists");
        });
        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            if (!existing.getId().equals(staffId)) throw new BadRequestException("Username already exists");
        });
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setDisplayName((request.getFirstName() + " " + request.getLastName()).trim());
        Profile profile = user.getProfile();
        if (profile == null) { profile = new Profile(); profile.setUser(user); user.setProfile(profile); }
        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        user.setJoiningDate(request.getJoiningDate());
        user.setExperienceYears(request.getExperienceYears());
        user.setShift(request.getShift());
        user.setGovtIdType(request.getGovtIdType());
        user.setGovtIdNumber(request.getGovtIdNumber());
        userRepository.save(user);
        return mapToUserResponse(user);
    }

    private Cafe resolveAndValidateCafe(User owner, Long requestedCafeId) {
        if (requestedCafeId != null) {
            Cafe cafe = cafeRepository.findById(requestedCafeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + requestedCafeId));
            if (!cafe.getOwner().getId().equals(owner.getId()))
                throw new AccessDeniedException("You do not own this cafe");
            return cafe;
        }
        Cafe cafe = owner.getCafe();
        if (cafe == null) throw new BadRequestException("Owner is not linked to any cafe");
        return cafe;
    }

    private User buildStaffUser(Cafe cafe,
                                User owner,
                                Role role,
                                CreateStaffRequest req,
                                String tempPassword,
                                String normalizedUsername,
                                String normalizedEmail,
                                String normalizedFirstName,
                                String normalizedLastName) {
        User user = new User();
        user.setUsername(normalizedUsername); user.setEmail(normalizedEmail);
        user.setFirstName(normalizedFirstName); user.setLastName(normalizedLastName);
        user.setDisplayName((normalizedFirstName + " " + normalizedLastName).trim());
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setCreatedByUser(owner); user.setCafe(cafe);
        user.setIsActive(true); user.setIsEmailVerified(true);
        user.setIsProfileComplete(true); user.setProfileCompletionPercentage(100);
        user.setMustResetPassword(true); user.setIsTempPassword(true);
        user.setRegistrationStatus(User.RegistrationStatus.APPROVED);
        user.getRoles().add(role);
        user.setJoiningDate(req.getJoiningDate()); user.setExperienceYears(req.getExperienceYears());
        user.setShift(req.getShift()); user.setGovtIdType(req.getGovtIdType());
        user.setGovtIdNumber(req.getGovtIdNumber());
        Profile profile = new Profile();
        profile.setUser(user);
        profile.setFirstName(normalizedFirstName);
        profile.setLastName(normalizedLastName);
        profile.setGovtIdType(req.getGovtIdType());
        profile.setGovtIdNumber(req.getGovtIdNumber());
        user.setProfile(profile);
        return user;
    }

    private String normalizeEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String resolveUniqueStaffUsername(String preferredUsername, String email) {
        String preferred = normalizeUsernameForStaff(preferredUsername);
        String emailBase = normalizeUsernameForStaff(extractEmailLocalPart(email));
        String fallbackBase = emailBase.isBlank() ? "staff" : emailBase;

        if (!preferred.isBlank() && !userRepository.existsByUsernameIgnoreCase(preferred)) {
            return preferred;
        }
        if (!emailBase.isBlank() && !userRepository.existsByUsernameIgnoreCase(emailBase)) {
            return emailBase;
        }

        String base = !preferred.isBlank() ? preferred : fallbackBase;
        for (int i = 2; i < 10000; i++) {
            String candidate = trimToMaxLength(base + "." + i, 50);
            if (!userRepository.existsByUsernameIgnoreCase(candidate)) {
                return candidate;
            }
        }
        throw new BadRequestException("Unable to generate unique username for staff");
    }

    private String normalizeUsernameForStaff(String raw) {
        String value = normalizeText(raw).toLowerCase();
        if (value.isBlank()) {
            return "";
        }
        // Keep only safe characters for predictable unique usernames.
        value = value.replaceAll("[^a-z0-9._]+", ".");
        value = value.replaceAll("\\.{2,}", ".");
        value = value.replaceAll("^[._]+|[._]+$", "");
        if (value.isBlank()) {
            return "";
        }
        return trimToMaxLength(value, 50);
    }

    private String extractEmailLocalPart(String email) {
        String normalized = normalizeEmail(email);
        int at = normalized.indexOf('@');
        if (at <= 0) {
            return normalized;
        }
        return normalized.substring(0, at);
    }

    private String trimToMaxLength(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    private User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private UserResponse mapToUserResponse(User user) {
        Profile profile = user.getProfile();
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName() != null ? user.getFirstName() : profile != null ? profile.getFirstName() : null)
                .lastName(user.getLastName() != null ? user.getLastName() : profile != null ? profile.getLastName() : null)
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .isProfileComplete(user.getIsProfileComplete())
                .profileCompletionPercentage(user.getProfileCompletionPercentage())
                .mustResetPassword(user.getMustResetPassword())
                .roles(user.getRoles().stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toList()))
                .cafeName(user.getCafe() != null ? user.getCafe().getName() : null)
                .registrationStatus(user.getRegistrationStatus() != null
                        ? user.getRegistrationStatus().name()
                        : User.RegistrationStatus.APPROVED.name())
                .cafeId(user.getCafe() != null ? user.getCafe().getId() : null)
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .experienceYears(user.getExperienceYears())
                .shift(user.getShift())
                .joiningDate(user.getJoiningDate())
                .govtIdType(user.getGovtIdType() != null ? user.getGovtIdType() : profile != null ? profile.getGovtIdType() : null)
                .govtIdNumber(user.getGovtIdNumber() != null ? user.getGovtIdNumber() : profile != null ? profile.getGovtIdNumber() : null)
                .build();
    }
}

