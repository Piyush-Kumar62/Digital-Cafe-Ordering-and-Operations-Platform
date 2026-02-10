package com.digitalcafe.controller;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.service.CafeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for cafe management operations.
 * Handles CRUD operations for cafes.
 */
@RestController
@RequestMapping("/api/cafes")
@RequiredArgsConstructor
public class CafeController {

    private final CafeService cafeService;

    @PostMapping("/owner/{ownerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CafeResponse>> createCafe(
            @PathVariable Long ownerId,
            @Valid @RequestBody CafeRequest request) {
        CafeResponse response = cafeService.createCafe(ownerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cafe created successfully", response));
    }

    @PutMapping("/{cafeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER')")
    public ResponseEntity<ApiResponse<CafeResponse>> updateCafe(
            @PathVariable Long cafeId,
            @Valid @RequestBody CafeRequest request) {
        CafeResponse response = cafeService.updateCafe(cafeId, request);
        return ResponseEntity.ok(ApiResponse.success("Cafe updated successfully", response));
    }

    @GetMapping("/{cafeId}")
    public ResponseEntity<ApiResponse<CafeResponse>> getCafeById(@PathVariable Long cafeId) {
        CafeResponse response = cafeService.getCafeById(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Cafe retrieved successfully", response));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CafeResponse>>> getActiveCafes() {
        List<CafeResponse> response = cafeService.getActiveCafes();
        return ResponseEntity.ok(ApiResponse.success("Active cafes retrieved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CafeResponse>>> getAllCafes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {

        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        PageResponse<CafeResponse> response = cafeService.getAllCafes(pageable);
        return ResponseEntity.ok(ApiResponse.success("Cafes retrieved successfully", response));
    }

    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER')")
    public ResponseEntity<ApiResponse<List<CafeResponse>>> getCafesByOwnerId(@PathVariable Long ownerId) {
        List<CafeResponse> response = cafeService.getCafesByOwnerId(ownerId);
        return ResponseEntity.ok(ApiResponse.success("Cafes retrieved successfully", response));
    }

    @DeleteMapping("/{cafeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCafe(@PathVariable Long cafeId) {
        cafeService.deleteCafe(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Cafe deleted successfully", null));
    }

    @PatchMapping("/{cafeId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER')")
    public ResponseEntity<ApiResponse<CafeResponse>> toggleCafeStatus(
            @PathVariable Long cafeId,
            @RequestParam boolean isActive) {
        CafeResponse response = cafeService.toggleCafeStatus(cafeId, isActive);
        return ResponseEntity.ok(ApiResponse.success("Cafe status updated successfully", response));
    }
}

