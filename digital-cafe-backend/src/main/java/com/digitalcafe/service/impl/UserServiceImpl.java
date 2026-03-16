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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Override
    @Transactional
    public UserResponse createStaffByOwner(CreateStaffRequest request) {

        User currentOwner = getCurrentUserEntity();
        if (!currentOwner.hasRole(Role.RoleName.CAFE_OWNER))
            throw new BadRequestException("Only Cafe Owner can create staff");

        Role.RoleName roleName;
        try {
            roleName = Role.RoleName.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            throw new BadRequestException("Invalid role. Allowed roles: CHEF, WAITER");
        }
        if (roleName != Role.RoleName.CHEF && roleName != Role.RoleName.WAITER)
            throw new BadRequestException("Only CHEF or WAITER can be created");

        if (userRepository.existsByEmail(request.getEmail())
                || userRepository.existsByUsernameIgnoreCase(request.getUsername().trim()))
            throw new BadRequestException("Username or Email already exists");

        Cafe cafe = resolveAndValidateCafe(currentOwner, request.getCafeId());
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName.name()));
        String tempPassword = PasswordGenerator.generateTemporaryPassword();
        User user = userRepository.save(buildStaffUser(cafe, currentOwner, role, request, tempPassword));
        log.info("{} created by owner {} for cafe {}", roleName, currentOwner.getEmail(), cafe.getName());
        String roleLabel = roleName == Role.RoleName.CHEF ? "Chef" : "Waiter";
        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername(), tempPassword, roleLabel, "/" + roleLabel.toLowerCase() + "/dashboard");
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
        user.setIsActive(true);
        userRepository.save(user);
        log.info("User activated: {}", user.getEmail());
    }

    @Override
    @Transactional
    public void deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getEmail());
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
        user.setIsActive(isActive);
        userRepository.save(user);
        log.info("User {} status changed to: {}", user.getEmail(), isActive);
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
    }

    @Override
    @Transactional
    public void rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setRegistrationStatus(User.RegistrationStatus.REJECTED);
        user.setIsActive(false);
        userRepository.save(user);
        emailService.sendRejectionEmail(user.getEmail());
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

    private User buildStaffUser(Cafe cafe, User owner, Role role, CreateStaffRequest req, String tempPassword) {
        User user = new User();
        user.setUsername(req.getUsername()); user.setEmail(req.getEmail());
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
        return user;
    }

    private User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
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
                .build();
    }
}

