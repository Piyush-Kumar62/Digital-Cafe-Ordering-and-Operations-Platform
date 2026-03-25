package com.digitalcafe.repository;

import com.digitalcafe.entity.Profile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    Optional<Profile> findByUserId(Long userId);
    // Avoid multiple bag fetch; load collections separately in service
    @EntityGraph(attributePaths = {"address"})
    Optional<Profile> findWithDetailsByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
