package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.CreateStaffRequest;
import com.digitalcafe.dto.request.CreateUserRequest;
import com.digitalcafe.dto.response.UserResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BadRequestException;
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
    public UserResponse createCafeOwner(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Role ownerRole = roleRepository.findByName(Role.RoleName.CAFE_OWNER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", "CAFE_OWNER"));

        String tempPassword = PasswordGenerator.generateTemporaryPassword();

        User user = User.builder()
                .username(request.getEmail())
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .roles(Collections.singleton(ownerRole))
                .isActive(true)
                .isEmailVerified(true) // Admin creates, so verified by default
                .isProfileComplete(false)
                .mustResetPassword(true)
                .profileCompletionPercentage(0)
                .build();

        user = userRepository.save(user);
        log.info("Cafe owner created: {}", user.getEmail());

        // Send welcome email with credentials
        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername(), tempPassword);

        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createChef(Long cafeId, CreateUserRequest request) {
        return createStaffUser(cafeId, request, Role.RoleName.CHEF);
    }

    @Override
    @Transactional
    public UserResponse createWaiter(Long cafeId, CreateUserRequest request) {
        return createStaffUser(cafeId, request, Role.RoleName.WAITER);
    }

    private UserResponse createStaffUser(Long cafeId, CreateUserRequest request, Role.RoleName roleName) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", cafeId));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName.name()));

        String tempPassword = PasswordGenerator.generateTemporaryPassword();

        User currentUser = getCurrentUserEntity();

        User user = User.builder()
                .username(request.getEmail())
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .roles(Collections.singleton(role))
                .cafe(cafe)
                .createdByUser(currentUser)
                .isActive(true)
                .isEmailVerified(true)
                .isProfileComplete(false)
                .mustResetPassword(true)
                .profileCompletionPercentage(0)
                .build();

        user = userRepository.save(user);
        log.info("{} created: {} for cafe: {}", roleName, user.getEmail(), cafe.getName());

        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername(), tempPassword);

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
    public UserResponse createStaff(CreateStaffRequest request, String roleName) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Cafe cafe = cafeRepository.findById(request.getCafeId())
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", request.getCafeId()));

        Role.RoleName roleEnum = Role.RoleName.valueOf(roleName);
        Role role = roleRepository.findByName(roleEnum)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));

        String tempPassword = PasswordGenerator.generateTemporaryPassword();
        User currentUser = getCurrentUserEntity();

        User user = User.builder()
                .username(request.getEmail())
                .email(request.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .roles(Collections.singleton(role))
                .cafe(cafe)
                .createdByUser(currentUser)
                .isActive(true)
                .isEmailVerified(true)
                .isProfileComplete(false)
                .mustResetPassword(true)
                .profileCompletionPercentage(0)
                .build();

        user = userRepository.save(user);
        log.info("{} created: {} for cafe: {}", roleName, user.getEmail(), cafe.getName());

        emailService.sendWelcomeEmail(user.getEmail(), user.getUsername(), tempPassword);

        return mapToUserResponse(user);
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
    public UserResponse getCurrentUser() {
        User user = getCurrentUserEntity();
        return mapToUserResponse(user);
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
                .cafeId(user.getCafe() != null ? user.getCafe().getId() : null)
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }
}

