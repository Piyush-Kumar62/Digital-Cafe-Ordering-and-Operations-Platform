package com.digitalcafe.repository;

import com.digitalcafe.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Role entity operations.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Finds a role by its name.
     */
    Optional<Role> findByName(Role.RoleName name);

    /**
     * Checks if a role exists by name.
     */
    boolean existsByName(Role.RoleName name);
}
