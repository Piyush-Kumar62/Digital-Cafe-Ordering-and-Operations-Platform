package com.digitalcafe.controller;

import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.dto.response.PublicCafeCardResponse;
import com.digitalcafe.dto.response.PublicCafeDetailResponse;
import com.digitalcafe.service.CafeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/cafes")
@RequiredArgsConstructor
public class PublicCafeController {

    private final CafeService cafeService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PublicCafeCardResponse>>> getActiveCafes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<PublicCafeCardResponse> response = cafeService.getPublicActiveCafes(pageable);
        return ResponseEntity.ok(ApiResponse.success("Public cafes retrieved successfully", response));
    }

    @GetMapping("/{cafeId}")
    public ResponseEntity<ApiResponse<PublicCafeDetailResponse>> getCafeDetails(@PathVariable Long cafeId) {
        PublicCafeDetailResponse response = cafeService.getPublicCafeDetails(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Cafe details retrieved successfully", response));
    }
}
