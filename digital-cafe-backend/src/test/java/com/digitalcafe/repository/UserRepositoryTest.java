package com.digitalcafe.repository;

import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Test
    void shouldFindUserByEmailAndRole() {
        Role role = roleRepository.save(Role.builder()
                .name(Role.RoleName.CUSTOMER)
                .description("Customer role")
                .build());

        User user = User.builder()
                .username("customer1")
                .email("customer1@test.com")
                .password("encoded-password")
                .isActive(true)
                .isEmailVerified(true)
                .isProfileComplete(true)
                .roles(Set.of(role))
                .build();

        userRepository.save(user);

        assertThat(userRepository.findByEmail("customer1@test.com")).isPresent();
        assertThat(userRepository.findByRoleName(Role.RoleName.CUSTOMER))
                .extracting(User::getEmail)
                .contains("customer1@test.com");
    }
}
