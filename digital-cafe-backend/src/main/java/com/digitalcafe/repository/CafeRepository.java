package com.digitalcafe.repository;

import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CafeRepository extends JpaRepository<Cafe, Long> {
    List<Cafe> findByIsActive(Boolean active);
    List<Cafe> findByCity(String city);
    List<Cafe> findByOwnerId(Long ownerId);
    List<Cafe> findByOwnerIdAndIsActive(Long ownerId, Boolean active);
    List<Cafe> findByOwner(User owner);

    // Pageable support
    Page<Cafe> findByCity(String city, Pageable pageable);
    Page<Cafe> findByOwnerId(Long ownerId, Pageable pageable);
    Page<Cafe> findByIsActive(Boolean active, Pageable pageable);
}
