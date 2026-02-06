package com.digitalcafe.service;

import com.digitalcafe.config.JwtUtil;
import com.digitalcafe.dto.UserDTO;
import com.digitalcafe.dto.UserRequestDTO;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.model.User;
import com.digitalcafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return convertToDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return convertToDTO(user);
    }

    @Transactional(readOnly = true)
    public UserDTO getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return convertToDTO(user);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getUsersByRole(String role) {
        User.Role userRole = User.Role.valueOf(role.toUpperCase());
        return userRepository.findByRole(userRole).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO createUser(UserRequestDTO userRequestDTO) {
        if (userRepository.existsByEmail(userRequestDTO.getEmail())) {
            throw new BadRequestException("Email already exists: " + userRequestDTO.getEmail());
        }
        if (userRepository.existsByUsername(userRequestDTO.getUsername())) {
            throw new BadRequestException("Username already exists: " + userRequestDTO.getUsername());
        }

        User user = new User();
        user.setUsername(userRequestDTO.getUsername());
        user.setEmail(userRequestDTO.getEmail());
        user.setPassword(userRequestDTO.getPassword()); // TODO: Hash password with BCrypt
        user.setRole(User.Role.valueOf(userRequestDTO.getRole().toUpperCase()));
        user.setActive(true);
        user.setEmailVerified(false);
        user.setProfileCompleted(false);
        user.setTempPassword(true);

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    @Transactional
    public UserDTO updateUser(Long id, UserRequestDTO userRequestDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!user.getEmail().equals(userRequestDTO.getEmail()) &&
            userRepository.existsByEmail(userRequestDTO.getEmail())) {
            throw new BadRequestException("Email already exists: " + userRequestDTO.getEmail());
        }

        if (!user.getUsername().equals(userRequestDTO.getUsername()) &&
            userRepository.existsByUsername(userRequestDTO.getUsername())) {
            throw new BadRequestException("Username already exists: " + userRequestDTO.getUsername());
        }

        user.setUsername(userRequestDTO.getUsername());
        user.setEmail(userRequestDTO.getEmail());
        if (userRequestDTO.getPassword() != null && !userRequestDTO.getPassword().isEmpty()) {
            user.setPassword(userRequestDTO.getPassword()); // TODO: Hash password
        }
        user.setRole(User.Role.valueOf(userRequestDTO.getRole().toUpperCase()));

        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        userRepository.delete(user);
    }

    @Transactional
    public UserDTO activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(true);
        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    @Transactional
    public UserDTO deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setActive(false);
        User updatedUser = userRepository.save(user);
        return convertToDTO(updatedUser);
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setActive(user.getActive());
        dto.setEmailVerified(user.getEmailVerified());
        dto.setProfileCompleted(user.getProfileCompleted());
        return dto;
    }

    /**
     * Admin creates Café Owner account
     */
    @Transactional
    public com.digitalcafe.dto.StaffCreationResponse createCafeOwner(com.digitalcafe.dto.CreateStaffRequest request, String authHeader) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists: " + request.getEmail());
        }

        // Extract admin user from JWT
        String token = authHeader.replace("Bearer ", "");
        String adminUsername = jwtUtil.extractUsername(token);
        User admin = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", adminUsername));

        String tempPassword = generateTempPassword();

        User owner = new User();
        owner.setUsername(generateUsername(request.getFirstName(), request.getLastName()));
        owner.setEmail(request.getEmail());
        owner.setPassword(passwordEncoder.encode(tempPassword));
        owner.setRole(User.Role.CAFE_OWNER);
        owner.setActive(true);
        owner.setEmailVerified(false);
        owner.setProfileCompleted(false);
        owner.setTempPassword(true);
        owner.setCreatedBy(admin);

        User savedOwner = userRepository.save(owner);
        // TODO: Send email with credentials (temp password: tempPassword)
        
        return new com.digitalcafe.dto.StaffCreationResponse(
            savedOwner.getId(),
            savedOwner.getUsername(),
            savedOwner.getEmail(),
            savedOwner.getRole().name(),
            tempPassword,
            savedOwner.getActive(),
            savedOwner.getEmailVerified(),
            savedOwner.getProfileCompleted()
        );
    }

    /**
     * Café Owner creates Chef account
     */
    @Transactional
    public com.digitalcafe.dto.StaffCreationResponse createChef(com.digitalcafe.dto.CreateStaffRequest request, String authHeader) {
        // CafeId is optional - if provided, validate it exists
        if (request.getCafeId() != null) {
            // TODO: Validate cafe exists and belongs to the owner
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists: " + request.getEmail());
        }

        // Extract owner user from JWT
        String token = authHeader.replace("Bearer ", "");
        String ownerUsername = jwtUtil.extractUsername(token);
        User owner = userRepository.findByUsername(ownerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", ownerUsername));

        String tempPassword = generateTempPassword();

        User chef = new User();
        chef.setUsername(generateUsername(request.getFirstName(), request.getLastName()));
        chef.setEmail(request.getEmail());
        chef.setPassword(passwordEncoder.encode(tempPassword));
        chef.setRole(User.Role.CHEF);
        chef.setActive(true);
        chef.setEmailVerified(false);
        chef.setProfileCompleted(false);
        chef.setTempPassword(true);
        chef.setCreatedBy(owner);

        User savedChef = userRepository.save(chef);
        // TODO: Send email with credentials (temp password: tempPassword)
        
        return new com.digitalcafe.dto.StaffCreationResponse(
            savedChef.getId(),
            savedChef.getUsername(),
            savedChef.getEmail(),
            savedChef.getRole().name(),
            tempPassword,
            savedChef.getActive(),
            savedChef.getEmailVerified(),
            savedChef.getProfileCompleted()
        );
    }

    /**
     * Café Owner creates Waiter account
     */
    @Transactional
    public com.digitalcafe.dto.StaffCreationResponse createWaiter(com.digitalcafe.dto.CreateStaffRequest request, String authHeader) {
        // CafeId is optional - if provided, validate it exists
        if (request.getCafeId() != null) {
            // TODO: Validate cafe exists and belongs to the owner
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists: " + request.getEmail());
        }

        // Extract owner user from JWT
        String token = authHeader.replace("Bearer ", "");
        String ownerUsername = jwtUtil.extractUsername(token);
        User owner = userRepository.findByUsername(ownerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", ownerUsername));

        String tempPassword = generateTempPassword();

        User waiter = new User();
        waiter.setUsername(generateUsername(request.getFirstName(), request.getLastName()));
        waiter.setEmail(request.getEmail());
        waiter.setPassword(passwordEncoder.encode(tempPassword));
        waiter.setRole(User.Role.WAITER);
        waiter.setActive(true);
        waiter.setEmailVerified(false);
        waiter.setProfileCompleted(false);
        waiter.setTempPassword(true);
        waiter.setCreatedBy(owner);

        User savedWaiter = userRepository.save(waiter);
        // TODO: Send email with credentials (temp password: tempPassword)
        
        return new com.digitalcafe.dto.StaffCreationResponse(
            savedWaiter.getId(),
            savedWaiter.getUsername(),
            savedWaiter.getEmail(),
            savedWaiter.getRole().name(),
            tempPassword,
            savedWaiter.getActive(),
            savedWaiter.getEmailVerified(),
            savedWaiter.getProfileCompleted()
        );
    }

    private String generateUsername(String firstName, String lastName) {
        String baseUsername = (firstName + "." + lastName).toLowerCase().replaceAll("[^a-z.]", "");
        String username = baseUsername;
        int counter = 1;
        
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter;
            counter++;
        }
        
        return username;
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        StringBuilder password = new StringBuilder();
        java.util.Random random = new java.util.Random();
        
        for (int i = 0; i < 8; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return password.toString();
    }
}
