package com.digitalcafe.repository;

import com.digitalcafe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    List<User> findByRole(User.Role role);
    List<User> findByActive(Boolean active);
    List<User> findByCreatedById(Long createdById);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    
    // Dashboard queries
    Long countByActive(Boolean active);
    Long countByEmailVerified(Boolean emailVerified);
    Long countByProfileCompleted(Boolean profileCompleted);
    Long countByCreatedAtAfter(LocalDateTime date);
    Long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    Long countByRole(User.Role role);
    Long countByRoleAndCreatedBy(User.Role role, User createdBy);
    List<User> findTop10ByOrderByCreatedAtDesc();
}
