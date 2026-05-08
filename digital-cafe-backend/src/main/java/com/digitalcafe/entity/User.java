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
        @Index(name = "idx_email", columnList = "email"),
        @Index(name = "idx_user_cafe_id", columnList = "cafe_id"),
        @Index(name = "idx_created_by_user_id", columnList = "created_by_user_id")
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

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "display_name", length = 150)
    private String displayName;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "registration_status", nullable = false, length = 30)
    @Builder.Default
    private RegistrationStatus registrationStatus = RegistrationStatus.APPROVED;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 20)
    @Builder.Default
    private AccountStatus accountStatus = AccountStatus.ACTIVE;

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

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private UserPreference userPreference;

    // Relationship tracking for staff created by cafe owners
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    // Reference to cafe for CAFE_OWNER, CHEF, WAITER
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;

    // Staff-specific fields (CHEF / WAITER roles)
    @Column(name = "joining_date")
    private java.time.LocalDate joiningDate;

    @Column(name = "shift", length = 20)
    private String shift;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "govt_id_type", length = 50)
    private String govtIdType;

    @Column(name = "govt_id_number", length = 100)
    private String govtIdNumber;


    /**
     * Checks if user can access the system based on security rules.
     * Access is blocked if profile is incomplete or email is not verified.
     */
    public boolean canAccessSystem() {
        return isActive && isEmailVerified && isProfileComplete && registrationStatus == RegistrationStatus.APPROVED;
    }

    public enum RegistrationStatus {
        PENDING_APPROVAL,
        APPROVED,
        REJECTED
    }

    public enum AccountStatus {
        ACTIVE,
        DISABLED
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

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
        this.accountStatus = Boolean.TRUE.equals(isActive) ? AccountStatus.ACTIVE : AccountStatus.DISABLED;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = accountStatus == null ? AccountStatus.ACTIVE : accountStatus;
        this.isActive = this.accountStatus == AccountStatus.ACTIVE;
    }

    public void setIsEmailVerified(Boolean isEmailVerified) {
        this.isEmailVerified = isEmailVerified;
        this.emailVerified = isEmailVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
        this.isEmailVerified = emailVerified;
    }

    @PrePersist
    @PreUpdate
    private void syncDerivedAccountFields() {
        if (this.accountStatus == null) {
            this.accountStatus = Boolean.TRUE.equals(this.isActive) ? AccountStatus.ACTIVE : AccountStatus.DISABLED;
        }
        if (this.isActive == null) {
            this.isActive = this.accountStatus == AccountStatus.ACTIVE;
        }
        if (this.emailVerified == null) {
            this.emailVerified = Boolean.TRUE.equals(this.isEmailVerified);
        }
        if (this.isEmailVerified == null) {
            this.isEmailVerified = Boolean.TRUE.equals(this.emailVerified);
        }
    }
}
