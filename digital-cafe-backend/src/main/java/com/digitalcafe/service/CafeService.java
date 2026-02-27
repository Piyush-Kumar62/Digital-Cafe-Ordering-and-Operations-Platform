package com.digitalcafe.service;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service interface for cafe management operations.
 */
public interface CafeService {

    /**
     * Create a new cafe for a cafe owner
     */
    CafeResponse createCafe(Long ownerId, CafeRequest request, MultipartFile logo);

    /**
     * Check if cafe already exists for owner
     */
    boolean existsByOwnerId(Long ownerId);

    /**
     * Update cafe information
     */
    CafeResponse updateCafe(Long cafeId, CafeRequest request , MultipartFile logo);

    /**
     * Get cafe by ID
     */
    CafeResponse getCafeById(Long cafeId);

    /**
     * Get all cafes with pagination
     */
    PageResponse<CafeResponse> getAllCafes(Pageable pageable);

    /**
     * Get all active cafes (public endpoint for landing page)
     */
    List<CafeResponse> getActiveCafes();

    /**
     * Get cafe owned by logged-in owner (used for dashboard)
     */

    CafeResponse getCafeByOwner(Long ownerId);
    /**
     * Delete a cafe
     */
    void deleteCafe(Long cafeId);

    /**
     * Activate or deactivate a cafe
     */
    CafeResponse toggleCafeStatus(Long cafeId, boolean isActive);
    List<String> getGalleryImages(Long cafeId);
    void deleteGalleryImage(Long imageId);
    void uploadGallery(Long cafeId, List<MultipartFile> files);

    //response for cafe settings page (owner dashboard)
    CafeResponse getMyCafe();
}