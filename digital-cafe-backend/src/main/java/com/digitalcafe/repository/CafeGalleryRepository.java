package com.digitalcafe.repository;

import com.digitalcafe.entity.CafeGallery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for CafeGallery images.
 */
@Repository
public interface CafeGalleryRepository extends JpaRepository<CafeGallery, Long> {

    /**
     * Retrieves all gallery images for a cafe, ordered by display position.
     */
    List<CafeGallery> findByCafeIdOrderByDisplayOrderAsc(Long cafeId);

    /**
     * Retrieves all gallery images for a cafe (unordered — used by service layer for deletions).
     */
    List<CafeGallery> findByCafeId(Long cafeId);
}
