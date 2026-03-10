package com.digitalcafe.controller;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.security.CustomUserPrincipal;
import com.digitalcafe.service.CafeService;
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
import org.springframework.core.io.ByteArrayResource;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/cafes")
@RequiredArgsConstructor
public class CafeController {

    private final CafeService cafeService;

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

        String path = cafeService.updateLogo(cafeId, file);
        return ResponseEntity.ok(ApiResponse.success("Logo uploaded successfully", path));
    }

    @PostMapping(value = "/{cafeId}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CAFE_OWNER','ADMIN')")
    public ResponseEntity<ApiResponse<String>> uploadCover(
            @PathVariable Long cafeId,
            @RequestParam("file") MultipartFile file) {

        String path = cafeService.updateCover(cafeId, file);
        return ResponseEntity.ok(ApiResponse.success("Cover uploaded successfully", path));
    }

    @GetMapping("/{cafeId}/cover")
    public ResponseEntity<Resource> getCafeCover(@PathVariable Long cafeId) throws IOException {

        String coverPath = cafeService.getCafeById(cafeId).getCoverUrl();

        if (coverPath == null || coverPath.isEmpty()) {
            return placeholderImageResponse("Cafe Cover");
        }

        Path path;
        if (coverPath.startsWith("/uploads/")) {
            String filename = coverPath.substring("/uploads/".length());
            path = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
        } else {
            path = Paths.get(coverPath);
        }

        File file = path.toFile();
        if (!file.exists()) {
            return placeholderImageResponse("Cafe Cover");
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

    @PostMapping("/{cafeId}/gallery")
    @PreAuthorize("hasAnyRole('CAFE_OWNER','ADMIN')")
    public void uploadGallery(@PathVariable Long cafeId, @RequestParam MultipartFile[] files) {
        cafeService.uploadGallery(cafeId, Arrays.asList(files));
    }

    @GetMapping("/{cafeId}/logo")
    public ResponseEntity<Resource> getCafeLogo(@PathVariable Long cafeId) throws IOException {

        String logoPath = cafeService.getCafeById(cafeId).getLogoUrl();

        if (logoPath == null || logoPath.isEmpty()) {
            return placeholderImageResponse("Cafe Logo");
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
            return placeholderImageResponse("Cafe Logo");
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

    private ResponseEntity<Resource> placeholderImageResponse(String label) {
        String safeLabel = (label == null || label.isBlank()) ? "Image" : label.trim();
        String svg = "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='360' viewBox='0 0 600 360'>"
                + "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>"
                + "<stop offset='0%' stop-color='#0f172a'/>"
                + "<stop offset='100%' stop-color='#1d4ed8'/>"
                + "</linearGradient></defs>"
                + "<rect width='600' height='360' fill='url(#g)'/>"
                + "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' "
                + "font-family='Arial, sans-serif' font-size='30' fill='#e2e8f0'>" + safeLabel + "</text>"
                + "</svg>";
        ByteArrayResource resource = new ByteArrayResource(svg.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("image/svg+xml"))
                .body(resource);
    }

    @DeleteMapping("/gallery/{imageId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<?> deleteGallery(@PathVariable Long imageId) {
        cafeService.deleteGalleryImage(imageId);
        return ResponseEntity.ok("Deleted");
    }
}
