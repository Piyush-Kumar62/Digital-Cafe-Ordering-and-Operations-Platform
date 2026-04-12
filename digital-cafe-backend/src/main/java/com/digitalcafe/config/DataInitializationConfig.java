package com.digitalcafe.config;

import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.RoleRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.util.PasswordGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;

/**
 * Database initialization configuration.
 * Creates default roles and admin user on first startup.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.admin.bootstrap.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializationConfig {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${admin.email:${ADMIN_EMAIL:cafehub.admin@gmail.com}}")
    private String adminEmail;

    @Bean
    @Order(1)
    public CommandLineRunner initializeData() {
        return args -> {
            log.info("Starting database initialization...");

            // Create roles if they don't exist
            int rolesCreated = 0;
            rolesCreated += createRoleIfNotExists(Role.RoleName.ADMIN, "System Administrator") ? 1 : 0;
            rolesCreated += createRoleIfNotExists(Role.RoleName.CAFE_OWNER, "Cafe Owner") ? 1 : 0;
            rolesCreated += createRoleIfNotExists(Role.RoleName.CHEF, "Chef") ? 1 : 0;
            rolesCreated += createRoleIfNotExists(Role.RoleName.WAITER, "Waiter") ? 1 : 0;
            rolesCreated += createRoleIfNotExists(Role.RoleName.CUSTOMER, "Customer") ? 1 : 0;
            log.info("Role initialization summary: created={}, existing={}", rolesCreated, 5 - rolesCreated);

            // Create default admin user if not exists
            createAdminUserIfNotExists();

            log.info("Database initialization completed successfully!");
        };
    }

    private boolean createRoleIfNotExists(Role.RoleName roleName, String description) {
        if (!roleRepository.existsByName(roleName)) {
            Role role = Role.builder()
                    .name(roleName)
                    .description(description)
                    .build();
            roleRepository.save(role);
            log.info("Created role: {}", roleName);
            return true;
        } else {
            return false;
        }
    }

    private void createAdminUserIfNotExists() {
        boolean adminExistsByEmail = userRepository.existsByEmail(adminEmail);

        if (!adminExistsByEmail) {
            Role adminRole = roleRepository.findByName(Role.RoleName.ADMIN)
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));
            String tempPassword = PasswordGenerator.generateTemporaryPassword();

            User admin = User.builder()
                    .username(adminEmail)
                    .email(adminEmail)
                    .firstName("System")
                    .lastName("Admin")
                    .displayName("System Admin")
                    .password(passwordEncoder.encode(tempPassword))
                    .isActive(true)
                    .isEmailVerified(true)
                    .emailVerified(true)
                    .accountStatus(User.AccountStatus.ACTIVE)
                    .registrationStatus(User.RegistrationStatus.APPROVED)
                    .isProfileComplete(true)
                    .mustResetPassword(true)
                    .isTempPassword(true)
                    .profileCompletionPercentage(100)
                    .roles(Collections.singleton(adminRole))
                    .build();

            userRepository.save(admin);

            // Send generated temporary password to admin mailbox; never log password.
            emailService.sendWelcomeEmail(
                    adminEmail,
                    "System Admin",
                    tempPassword,
                    "ADMIN",
                    "/admin/dashboard"
            );
            log.info("Bootstrap admin created for {}. Temporary password was sent by email. Password reset is required at first login.", adminEmail);
        } else {
            log.info("Bootstrap admin already exists for {}", adminEmail);
        }
    }
}

