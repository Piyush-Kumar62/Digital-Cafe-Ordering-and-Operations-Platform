package com.digitalcafe.config;

import com.digitalcafe.model.Profile;
import com.digitalcafe.model.User;
import com.digitalcafe.repository.ProfileRepository;
import com.digitalcafe.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Initializes default data in the database
 * Creates default admin user if it doesn't exist
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    @Transactional
    public void init() {
        // Create default admin user if not exists
       if (!userRepository.existsByUsername("admin")) {
            log.info("Creating default admin user...");
            
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@digitalcafe.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(User.Role.ADMIN);
            admin.setActive(true);
            admin.setEmailVerified(true);
            admin.setProfileCompleted(true);
            admin.setTempPassword(false);
            
            admin = userRepository.save(admin);
            
            // Create profile for admin
            Profile adminProfile = new Profile();
            adminProfile.setUser(admin);
            adminProfile.setFirstName("System");
            adminProfile.setLastName("Admin");
            adminProfile.setPhone("0000000000");
            adminProfile.setCompletionPercentage(100);
            
            profileRepository.save(adminProfile);
            
            log.info("Default admin user created successfully with username: admin, password: admin123");
        } else {
            log.info("Admin user already exists, skipping initialization");
        }
    }
}
