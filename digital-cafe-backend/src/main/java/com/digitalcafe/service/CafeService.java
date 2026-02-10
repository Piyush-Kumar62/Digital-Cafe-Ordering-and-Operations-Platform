package com.digitalcafe.service;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for cafe management operations.
 */
public interface CafeService {

    /**
     * Create a new cafe for a cafe owner
     */
    CafeResponse createCafe(Long ownerId, CafeRequest request);

    /**
     * Update cafe information
     */
    CafeResponse updateCafe(Long cafeId, CafeRequest request);

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
     * Get cafes owned by a specific owner
     */
    List<CafeResponse> getCafesByOwnerId(Long ownerId);

    /**
     * Delete a cafe
     */
    void deleteCafe(Long cafeId);

    /**
     * Activate or deactivate a cafe
     */
    CafeResponse toggleCafeStatus(Long cafeId, boolean isActive);
}

