package com.digitalcafe.config;

import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.repository.RoleRepository;
import com.digitalcafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;

/**
 * Database initialization configuration.
 * Creates default roles and admin user on first startup.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializationConfig {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initializeData() {
        return args -> {
            log.info("Starting database initialization...");

            // Create roles if they don't exist
            createRoleIfNotExists(Role.RoleName.ADMIN, "System Administrator");
            createRoleIfNotExists(Role.RoleName.CAFE_OWNER, "Cafe Owner");
            createRoleIfNotExists(Role.RoleName.CHEF, "Chef");
            createRoleIfNotExists(Role.RoleName.WAITER, "Waiter");
            createRoleIfNotExists(Role.RoleName.CUSTOMER, "Customer");

            // Create default admin user if not exists
            createAdminUserIfNotExists();

            log.info("Database initialization completed successfully!");
        };
    }

    private void createRoleIfNotExists(Role.RoleName roleName, String description) {
        if (!roleRepository.existsByName(roleName)) {
            Role role = Role.builder()
                    .name(roleName)
                    .description(description)
                    .build();
            roleRepository.save(role);
            log.info("Created role: {}", roleName);
        } else {
            log.info("Role already exists: {}", roleName);
        }
    }

    private void createAdminUserIfNotExists() {
        String adminEmail = "admin@digitalcafe.com";

        if (!userRepository.existsByEmail(adminEmail)) {
            Role adminRole = roleRepository.findByName(Role.RoleName.ADMIN)
                    .orElseThrow(() -> new RuntimeException("Admin role not found"));

            User admin = User.builder()
                    .username(adminEmail)
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin@123"))
                    .isActive(true)
                    .isEmailVerified(true)
                    .isProfileComplete(true)
                    .mustResetPassword(false)
                    .profileCompletionPercentage(100)
                    .roles(Collections.singleton(adminRole))
                    .build();

            userRepository.save(admin);
            log.info("====================================");
            log.info("Default Admin User Created:");
            log.info("Email: {}", adminEmail);
            log.info("Password: Admin@123");
            log.info("====================================");
        } else {
            log.info("Admin user already exists");
        }
    }
}

