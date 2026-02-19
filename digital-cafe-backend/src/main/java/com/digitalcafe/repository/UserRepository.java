package com.digitalcafe.repository;

import com.digitalcafe.entity.User;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ================= AUTH =================

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameOrEmail(String username, String email);

    Optional<User> findByVerificationToken(String token);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // ================= STATUS =================

    List<User> findByStatus(UserStatus status);

    List<User> findByIsActive(Boolean isActive);

    // ================= ROLE =================

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findByRoleName(Role.RoleName roleName);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    Page<User> findByRolesName(Role.RoleName roleName, Pageable pageable);

    // ================= CAFE =================

    Page<User> findByCafeId(Long cafeId, Pageable pageable);

    List<User> findByCafeId(Long cafeId);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE u.cafe.id = :cafeId AND r.name = :roleName")
    List<User> findByCafeIdAndRoleName(Long cafeId, Role.RoleName roleName);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE u.cafe.id = :cafeId AND r.name IN :roleNames")
    List<User> findByCafeIdAndRoles(Long cafeId, List<Role.RoleName> roleNames);

    // ================= CREATOR =================

    List<User> findByCreatedByUserId(Long createdByUserId);

    // ================= DASHBOARD =================

    Long countByIsActive(Boolean isActive);

    Long countByIsEmailVerified(Boolean isEmailVerified);

    Long countByIsProfileComplete(Boolean isProfileComplete);

    Long countByCreatedAtAfter(LocalDateTime date);

    Long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName")
    Long countByRoleName(Role.RoleName roleName);

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.createdByUser = :createdBy")
    Long countByRoleNameAndCreatedBy(Role.RoleName roleName, User createdBy);

    List<User> findTop10ByOrderByCreatedAtDesc();
    List<User> findTop5ByOrderByCreatedAtDesc();

    // Additional dashboard queries
    Long countByMustResetPassword(Boolean mustResetPassword);
}
