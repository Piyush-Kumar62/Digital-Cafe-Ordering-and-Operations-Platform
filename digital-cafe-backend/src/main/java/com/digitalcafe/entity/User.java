package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Core User entity representing all system users across different roles.
 * Implements security constraints including email verification and profile completion.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_username", columnList = "username"),
        @Index(name = "idx_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(name = "is_profile_complete", nullable = false)
    @Builder.Default
    private Boolean isProfileComplete = false;

    @Column(name = "profile_completion_percentage")
    @Builder.Default
    private Integer profileCompletionPercentage = 0;

    @Column(name = "is_temp_password", nullable = false)
    @Builder.Default
    private Boolean isTempPassword = false;

    @Column(name = "must_reset_password", nullable = false)
    @Builder.Default
    private Boolean mustResetPassword = false;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Profile profile;

    // Relationship tracking for staff created by cafe owners
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    // Reference to cafe for CAFE_OWNER, CHEF, WAITER
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;

    /**
     * Checks if user can access the system based on security rules.
     * Access is blocked if profile is incomplete or email is not verified.
     */
    public boolean canAccessSystem() {
        return isActive && isEmailVerified && isProfileComplete;
    }

    /**
     * Adds a role to the user.
     */
    public void addRole(Role role) {
        this.roles.add(role);
    }

    /**
     * Checks if user has a specific role.
     */
    public boolean hasRole(Role.RoleName roleName) {
        return roles.stream().anyMatch(role -> role.getName().equals(roleName));
    }
}
