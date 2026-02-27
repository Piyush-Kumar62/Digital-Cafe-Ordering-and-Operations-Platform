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
import java.util.UUID;

@RestController
@RequestMapping("/api/cafes")
@RequiredArgsConstructor
public class CafeController {

    private final CafeService cafeService;
    private final CafeRepository cafeRepository;
    private final CafeGalleryRepository cafeGalleryRepository;
    private final FileStorageService fileStorageService;

    // ================= CREATE =================

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
            @RequestPart("data") CafeRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        Long ownerId = user.getId();

        CafeResponse response = cafeService.createCafe(ownerId, request, logo);
        return ResponseEntity.ok(response);
    }

    // ================= EXIST CHECK =================

    @GetMapping("/exists")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<Boolean> cafeExists(Authentication authentication) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(cafeService.existsByOwnerId(user.getId()));
    }

    // ================= UPDATE =================
    @PutMapping(value = "/{cafeId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<CafeResponse>> updateCafe(
            @PathVariable Long cafeId,
            @RequestPart("data") CafeRequest request,
            @RequestPart(value = "logo", required = false) MultipartFile logo) {

        CafeResponse response = cafeService.updateCafe(cafeId, request, logo);

        return ResponseEntity.ok(ApiResponse.success("Cafe updated successfully", response));
    }

    // ================= GET =================

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

    // ================= DELETE =================

    @DeleteMapping("/{cafeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCafe(@PathVariable Long cafeId) {
        cafeService.deleteCafe(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Cafe deleted successfully", null));
    }

    // ================= STATUS =================

    @PatchMapping("/{cafeId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'CAFE_OWNER')")
    public ResponseEntity<ApiResponse<CafeResponse>> toggleCafeStatus(
            @PathVariable Long cafeId,
            @RequestParam boolean isActive) {

        return ResponseEntity.ok(ApiResponse.success(
                "Cafe status updated successfully",
                cafeService.toggleCafeStatus(cafeId, isActive)));
    }

    // ================= OWNER =================

    @GetMapping("/my-cafe")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<CafeResponse>> getMyCafe(Authentication authentication) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                "Cafe fetched",
                cafeService.getCafeByOwner(user.getId())));
    }

    // ================= UPLOAD IMAGES =================

    @PostMapping("/{cafeId}/logo")
    public String uploadLogo(@PathVariable Long cafeId, @RequestParam MultipartFile file) {

        Cafe cafe = cafeRepository.findById(cafeId).orElseThrow();
        String path = fileStorageService.uploadFile(file); // must return FULL PATH

        cafe.setLogoUrl(path);
        cafeRepository.save(cafe);

        return path;
    }

    @PostMapping("/{cafeId}/cover")
    public String uploadCover(@PathVariable Long cafeId, @RequestParam MultipartFile file) {

        Cafe cafe = cafeRepository.findById(cafeId).orElseThrow();
        String path = fileStorageService.uploadFile(file);

        cafe.setCoverUrl(path);
        cafeRepository.save(cafe);

        return path;
    }

    // ================= VIEW LOGO =================

    @PostMapping(value = "/{cafeId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadCafeLogo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {

        Cafe cafe = cafeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cafe not found"));

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        // 🔥 Absolute uploads folder path
        String uploadDir = System.getProperty("user.dir") + File.separator + "uploads";

        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs(); // create uploads folder if not exists
        }

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String fullPath = uploadDir + File.separator + fileName;

        file.transferTo(new File(fullPath));

        // Save full path in DB
        cafe.setLogoUrl(fullPath);
        cafeRepository.save(cafe);

        return ResponseEntity.ok("Logo uploaded successfully");
    }

    // ================= VIEW COVER =================

    @GetMapping("/{cafeId}/cover")
    public ResponseEntity<Resource> getCafeCover(@PathVariable Long cafeId) throws IOException {

        Cafe cafe = cafeRepository.findById(cafeId).orElseThrow();
        Path path = Paths.get(cafe.getCoverUrl());

        Resource resource = new UrlResource(path.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(Files.probeContentType(path)))
                .body(resource);
    }

    // ================= GALLERY =================

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

        File file = new File(logoPath);

        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Path path = file.toPath();
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