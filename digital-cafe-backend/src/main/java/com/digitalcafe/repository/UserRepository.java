package com.digitalcafe.repository;

import com.digitalcafe.entity.User;
import com.digitalcafe.entity.Role;
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
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameOrEmail(String username, String email);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findByRoleName(Role.RoleName roleName);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u JOIN u.roles r WHERE r.name = :roleName")
    boolean existsByRoleName(Role.RoleName roleName);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    Page<User> findByRolesName(String roleName, Pageable pageable);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE u.cafe.id = :cafeId")
    Page<User> findByCafeId(Long cafeId, Pageable pageable);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE u.cafe.id = :cafeId AND r.name = :roleName")
    List<User> findByCafeIdAndRoleName(Long cafeId, Role.RoleName roleName);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE u.cafe.id = :cafeId AND r.name IN :roleNames")
    List<User> findByCafeIdAndRoles(Long cafeId, List<Role.RoleName> roleNames);

    List<User> findByIsActive(Boolean isActive);
    List<User> findByCreatedByUserId(Long createdByUserId);
    List<User> findByRegistrationStatus(User.RegistrationStatus registrationStatus);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    // Dashboard queries
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
    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // Additional dashboard queries
    Long countByMustResetPassword(Boolean mustResetPassword);
}
