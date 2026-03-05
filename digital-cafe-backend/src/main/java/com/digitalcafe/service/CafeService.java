package com.digitalcafe.service;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.dto.response.PublicCafeCardResponse;
import com.digitalcafe.dto.response.PublicCafeDetailResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service interface for cafe management operations.
 */
public interface CafeService {

    CafeResponse createCafe(Long ownerId, CafeRequest request, MultipartFile logo);

    boolean existsByOwnerId(Long ownerId);

    CafeResponse updateCafe(Long cafeId, CafeRequest request, MultipartFile logo);

    CafeResponse getCafeById(Long cafeId);

    CafeResponse getCafeByOwner(Long ownerId);

    PageResponse<CafeResponse> getCafesByOwner(Long ownerId, Pageable pageable);

    PageResponse<CafeResponse> getAllCafes(Pageable pageable);

    List<CafeResponse> getActiveCafes();

    void deleteCafe(Long cafeId);

    CafeResponse toggleCafeStatus(Long cafeId, boolean isActive);

    void uploadGallery(Long cafeId, List<MultipartFile> files);

    List<String> getGalleryImages(Long cafeId);

    void deleteGalleryImage(Long imageId);

    String updateLogo(Long cafeId, MultipartFile file);

    String updateCover(Long cafeId, MultipartFile file);

    CafeResponse getMyCafe();

    /**
     * Returns the cafe ID for the user with the given email.
     * Throws IllegalArgumentException if the user has no cafe assigned.
     */
    Long getCafeIdForUser(String email);

    PageResponse<PublicCafeCardResponse> getPublicActiveCafes(Pageable pageable);

    PublicCafeDetailResponse getPublicCafeDetails(Long cafeId);
}
