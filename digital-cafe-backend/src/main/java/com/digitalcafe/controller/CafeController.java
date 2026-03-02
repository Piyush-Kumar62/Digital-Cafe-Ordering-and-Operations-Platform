package com.digitalcafe.controller;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.CafeGallery;
import com.digitalcafe.repository.CafeGalleryRepository;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.security.CustomUserPrincipal;
import com.digitalcafe.service.CafeService;
import com.digitalcafe.storage.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.List;

@RestController
@RequestMapping("/api/cafes")
@RequiredArgsConstructor
public class CafeController {

    private final CafeService cafeService;
    private final CafeRepository cafeRepository;
    private final CafeGalleryRepository cafeGalleryRepository;
    private final FileStorageService fileStorageService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/owner/{ownerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CafeResponse>> createCafe(
            @PathVariable Long ownerId,
            @Valid @RequestBody CafeRequest request) {

        CafeResponse response = cafeService.createCafe(ownerId, request, null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Cafe created successfully", response));
    }

    @PostMapping(value = "/setup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<?> createCafe(
            Authentication authentication,
            @Valid @RequestPart("data") CafeRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        Long ownerId = user.getId();

        CafeResponse response = cafeService.createCafe(ownerId, request, logo);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/exists")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<Boolean> cafeExists(Authentication authentication) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(cafeService.existsByOwnerId(user.getId()));
    }

    @PutMapping(value = "/{cafeId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<CafeResponse>> updateCafe(
            @PathVariable Long cafeId,
            @Valid @RequestPart("data") CafeRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {

        CafeResponse response = cafeService.updateCafe(cafeId, request, logo);

        return ResponseEntity.ok(ApiResponse.success("Cafe updated successfully", response));
    }

    @GetMapping("/{cafeId}")
    public ResponseEntity<ApiResponse<CafeResponse>> getCafeById(@PathVariable Long cafeId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cafe retrieved successfully",
                cafeService.getCafeById(cafeId)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<CafeResponse>>> getActiveCafes() {
        return ResponseEntity.ok(ApiResponse.success(
                "Active cafes retrieved successfully",
                cafeService.getActiveCafes()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CafeResponse>>> getAllCafes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.fromString(sortDirection), sortBy));

        return ResponseEntity.ok(ApiResponse.success(
                "Cafes retrieved successfully",
                cafeService.getAllCafes(pageable)));
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

        return ResponseEntity.ok(ApiResponse.success(
                "Cafe status updated successfully",
                cafeService.toggleCafeStatus(cafeId, isActive)));
    }

    @GetMapping("/my-cafe")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<CafeResponse>> getMyCafe(Authentication authentication) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                "Cafe fetched",
                cafeService.getCafeByOwner(user.getId())));
    }

    @GetMapping("/my-cafes")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<PageResponse<CafeResponse>>> getMyCafes(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return ResponseEntity.ok(ApiResponse.success(
                "Cafes fetched",
                cafeService.getCafesByOwner(user.getId(), pageable)));
    }

    @PostMapping(value = "/{cafeId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CAFE_OWNER','ADMIN')")
    public ResponseEntity<ApiResponse<String>> uploadLogo(
            @PathVariable Long cafeId,
            @RequestParam("file") MultipartFile file) {

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));
        String path = fileStorageService.uploadFile(file);

        cafe.setLogoUrl(path);
        cafeRepository.save(cafe);

        return ResponseEntity.ok(ApiResponse.success("Logo uploaded successfully", path));
    }

    @PostMapping(value = "/{cafeId}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CAFE_OWNER','ADMIN')")
    public ResponseEntity<ApiResponse<String>> uploadCover(
            @PathVariable Long cafeId,
            @RequestParam("file") MultipartFile file) {

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));
        String path = fileStorageService.uploadFile(file);

        cafe.setCoverUrl(path);
        cafeRepository.save(cafe);

        return ResponseEntity.ok(ApiResponse.success("Cover uploaded successfully", path));
    }

    @GetMapping("/{cafeId}/cover")
    public ResponseEntity<Resource> getCafeCover(@PathVariable Long cafeId) throws IOException {

        Cafe cafe = cafeRepository.findById(cafeId).orElseThrow();
        Path path = Paths.get(cafe.getCoverUrl());

        Resource resource = new UrlResource(path.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(Files.probeContentType(path)))
                .body(resource);
    }

    @PostMapping("/{cafeId}/gallery")
    public void uploadGallery(@PathVariable Long cafeId, @RequestParam MultipartFile[] files) {

        Cafe cafe = cafeRepository.findById(cafeId).orElseThrow();

        for (MultipartFile file : files) {
            String path = fileStorageService.uploadFile(file);

            CafeGallery gallery = new CafeGallery();
            gallery.setCafe(cafe);
            gallery.setImageUrl(path);

            cafeGalleryRepository.save(gallery);
        }
    }

    @GetMapping("/{cafeId}/logo")
    public ResponseEntity<Resource> getCafeLogo(@PathVariable Long cafeId) throws IOException {

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));

        String logoPath = cafe.getLogoUrl();

        if (logoPath == null || logoPath.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Resolve path: new format is "/uploads/<filename>", legacy is an absolute filesystem path
        Path path;
        if (logoPath.startsWith("/uploads/")) {
            String filename = logoPath.substring("/uploads/".length());
            path = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
        } else {
            path = Paths.get(logoPath);
        }

        File file = path.toFile();
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(path.toUri());

        String contentType = Files.probeContentType(path);
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
    @GetMapping("/{cafeId}/gallery")
    public ResponseEntity<List<String>> getGallery(@PathVariable Long cafeId) {
        return ResponseEntity.ok(cafeService.getGalleryImages(cafeId));
    }

    @DeleteMapping("/gallery/{imageId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<?> deleteGallery(@PathVariable Long imageId) {
        cafeService.deleteGalleryImage(imageId);
        return ResponseEntity.ok("Deleted");
    }
}
