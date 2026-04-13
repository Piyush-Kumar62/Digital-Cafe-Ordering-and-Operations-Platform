package com.digitalcafe.repository;

import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CafeRepository extends JpaRepository<Cafe, Long> {
    List<Cafe> findByIsActive(Boolean active);
    List<Cafe> findByCity(String city);
    Optional<Cafe> findByOwnerId(Long ownerId);
    List<Cafe> findAllByOwnerId(Long ownerId);
    List<Cafe> findAllByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Page<Cafe> findByIsActiveTrue(Pageable pageable);
    List<Cafe> findByOwnerIdAndIsActive(Long ownerId, Boolean active);
    List<Cafe> findByOwner(User owner);

    // Pageable support
    Page<Cafe> findByCity(String city, Pageable pageable);
    Page<Cafe> findByOwnerId(Long ownerId, Pageable pageable);
    Page<Cafe> findByIsActive(Boolean active, Pageable pageable);

        @Query("""
                        SELECT c
                        FROM Cafe c
                        WHERE c.isActive = true
                            AND (
                                        :keyword IS NULL
                                 OR :keyword = ''
                                 OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                 OR LOWER(COALESCE(c.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                 OR LOWER(COALESCE(c.city, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                 OR LOWER(COALESCE(c.state, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                 OR LOWER(COALESCE(c.address, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                            )
                        """)
        Page<Cafe> searchActiveCafes(@Param("keyword") String keyword, Pageable pageable);
    
    // Dashboard queries
    Long countByIsActive(Boolean active);

    boolean existsByOwnerId(Long ownerId);
}
