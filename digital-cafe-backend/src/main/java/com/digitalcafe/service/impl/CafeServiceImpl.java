package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PublicCafeCardResponse;
import com.digitalcafe.dto.response.PublicCafeDetailResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.CafeGallery;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.AccessDeniedException;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.CafeMapper;
import com.digitalcafe.entity.MenuItem;
import com.digitalcafe.repository.CafeGalleryRepository;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.MenuItemRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.CafeService;
import com.digitalcafe.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CafeServiceImpl implements CafeService {

    private final CafeRepository cafeRepository;
    private final UserRepository userRepository;
    private final CafeGalleryRepository cafeGalleryRepository;
    private final MenuItemRepository menuItemRepository;
    private final FileStorageService fileStorageService;
    private final CafeMapper cafeMapper;


    @Override
    @Transactional
    public CafeResponse createCafe(Long ownerId, CafeRequest request, MultipartFile logo) {

        log.info("Creating cafe for owner ID: {}", ownerId);

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe owner not found with ID: " + ownerId));

        if (cafeRepository.existsByOwnerId(ownerId)) {
            // Multiple cafes allowed — no restriction
        }

        Cafe cafe = new Cafe();

        if (logo != null && !logo.isEmpty()) {
            try {
                String logoPath = fileStorageService.uploadFile(logo);
                cafe.setLogoUrl(logoPath);
            } catch (BusinessException ex) {
                log.error("Cafe logo upload failed for owner {}: {}", ownerId, ex.getMessage());
                throw new BadRequestException("Logo upload failed: " + ex.getMessage());
            }
        }


        cafe.setName(request.getName());
        cafe.setAddress(request.getAddress());
        cafe.setCity(request.getCity());
        cafe.setPincode(request.getPincode());
        cafe.setPhoneNumber(request.getPhoneNumber());


        cafe.setDescription(request.getDescription());
        cafe.setEmail(request.getEmail());
        cafe.setOpenTime(request.getOpenTime());
        cafe.setCloseTime(request.getCloseTime());

        cafe.setFssaiNumber(request.getFssaiNumber());
        cafe.setGstNumber(request.getGstNumber());
        cafe.setMsmeNumber(request.getMsmeNumber());
        cafe.setState(request.getState());

        cafe.setOwner(owner);
        cafe.setIsActive(true);

        Cafe savedCafe = cafeRepository.save(cafe);
        // Always set user's primary cafe reference to the latest created
        owner.setCafe(savedCafe);
        userRepository.save(owner);

        log.info("Cafe created successfully with ID: {}", savedCafe.getId());

        return cafeMapper.toResponse(savedCafe);
    }



    @Override
    public boolean existsByOwnerId(Long ownerId) {
        return cafeRepository.existsByOwnerId(ownerId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CafeResponse> getCafesByOwner(Long ownerId, Pageable pageable) {
        Page<Cafe> page = cafeRepository.findByOwnerId(ownerId, pageable);
        List<CafeResponse> content = page.getContent().stream()
                .map(cafeMapper::toResponse)
                .collect(Collectors.toList());
        return PageResponse.<CafeResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .hasNext(!page.isLast())
                .hasPrevious(!page.isFirst())
                .build();
    }


    @Override
    @Transactional
    public CafeResponse updateCafe(Long cafeId, CafeRequest request , MultipartFile logo) {

        log.info("Updating cafe with ID: {}", cafeId);

        verifyOwnerOrAdmin(cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));

        if (logo != null && !logo.isEmpty()) {
            try {
                // Delete old logo if stored
                if (cafe.getLogoUrl() != null) {
                    fileStorageService.deleteFile(cafe.getLogoUrl());
                }
                String logoPath = fileStorageService.uploadFile(logo);
                cafe.setLogoUrl(logoPath);
            } catch (BusinessException ex) {
                log.error("Logo upload failed during update for cafe {}: {}", cafeId, ex.getMessage());
                throw new BadRequestException("Logo upload failed: " + ex.getMessage());
            }
        }

        cafeMapper.updateCafeFromRequest(request, cafe);

        Cafe updatedCafe = cafeRepository.save(cafe);

        return cafeMapper.toResponse(updatedCafe);
    }


    @Override
    @Transactional(readOnly = true)
    public CafeResponse getCafeById(Long cafeId) {

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));

        return cafeMapper.toResponse(cafe);
    }


    @Override
    @Transactional(readOnly = true)
    public CafeResponse getCafeByOwner(Long ownerId) {

        List<Cafe> cafes = cafeRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId);
        if (cafes.isEmpty()) {
            throw new ResourceNotFoundException("Cafe not found");
        }
        return cafeMapper.toResponse(cafes.get(0));
    }


    @Override
    @Transactional(readOnly = true)
    public PageResponse<CafeResponse> getAllCafes(Pageable pageable) {

        Page<Cafe> cafePage = cafeRepository.findAll(pageable);

        List<CafeResponse> responses = cafePage.getContent()
                .stream()
                .map(cafeMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<CafeResponse>builder()
                .content(responses)
                .pageNumber(cafePage.getNumber())
                .pageSize(cafePage.getSize())
                .totalElements(cafePage.getTotalElements())
                .totalPages(cafePage.getTotalPages())
                .isLast(cafePage.isLast())
                .build();
    }


    @Override
    @Transactional(readOnly = true)
    public List<CafeResponse> getActiveCafes() {

        return cafeRepository.findByIsActive(true)
                .stream()
                .map(cafeMapper::toResponse)
                .collect(Collectors.toList());
    }


    @Override
    @Transactional
    public void deleteCafe(Long cafeId) {

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found"));

        if (cafe.getLogoUrl() != null) {
            fileStorageService.deleteFile(cafe.getLogoUrl());
        }

        if (cafe.getCoverUrl() != null) {
            fileStorageService.deleteFile(cafe.getCoverUrl());
        }


        List<CafeGallery> galleries = cafeGalleryRepository.findByCafeId(cafeId);
        for (CafeGallery g : galleries) {
            fileStorageService.deleteFile(g.getImageUrl());
        }

        cafeRepository.delete(cafe);
    }


    @Override
    @Transactional
    public CafeResponse toggleCafeStatus(Long cafeId, boolean isActive) {

        verifyOwnerOrAdmin(cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));

        cafe.setIsActive(isActive);

        return cafeMapper.toResponse(cafeRepository.save(cafe));
    }

    @Override
    public Long getCafeIdForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
        // Direct association (staff assigned to a cafe)
        if (user.getCafe() != null && user.getCafe().getId() != null) {
            return user.getCafe().getId();
        }
        // Owner: find cafes where this user is the owner
        List<Cafe> owned = cafeRepository.findAllByOwnerIdOrderByCreatedAtDesc(user.getId());
        if (!owned.isEmpty()) {
            return owned.get(0).getId();
        }
        throw new IllegalArgumentException("Authenticated user is not assigned to any cafe");
    }

    private User getCurrentOwner() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("User not authenticated");
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", "email", email));


        if (!user.hasRole(Role.RoleName.CAFE_OWNER)) {
            throw new BadRequestException("Only cafe owner allowed");
        }

        return user;
    }

    @Override
    public void uploadGallery(Long cafeId, List<MultipartFile> files) {

        verifyOwnerOrAdmin(cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", cafeId));

        for (MultipartFile file : files) {

            String path = fileStorageService.uploadFile(file);

            CafeGallery gallery = CafeGallery.builder()
                    .imageUrl(path)
                    .cafe(cafe)
                    .build();

            cafeGalleryRepository.save(gallery);
        }
    }

    @Override
    public List<String> getGalleryImages(Long cafeId) {

        return cafeGalleryRepository.findByCafeId(cafeId)
                .stream()
                .map(CafeGallery::getImageUrl)
                .toList();
    }

    @Override
    @Transactional
    public void deleteGalleryImage(Long imageId) {

        CafeGallery gallery = cafeGalleryRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image", "id", imageId));

        verifyOwnerOrAdmin(gallery.getCafe().getId());

        fileStorageService.deleteFile(gallery.getImageUrl());

        cafeGalleryRepository.delete(gallery);
    }

    @Transactional
    public String updateLogo(Long cafeId, MultipartFile file) {

        verifyOwnerOrAdmin(cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found"));


        if (cafe.getLogoUrl() != null) {
            fileStorageService.deleteFile(cafe.getLogoUrl());
        }

        String newPath = fileStorageService.uploadFile(file);
        cafe.setLogoUrl(newPath);

        cafeRepository.save(cafe);
        return newPath;
    }

    @Transactional
    public String updateCover(Long cafeId, MultipartFile file) {

        verifyOwnerOrAdmin(cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found"));

        if (cafe.getCoverUrl() != null) {
            fileStorageService.deleteFile(cafe.getCoverUrl());
        }

        String newPath = fileStorageService.uploadFile(file);
        cafe.setCoverUrl(newPath);

        cafeRepository.save(cafe);
        return newPath;
    }


    /**
     * Verifies the currently authenticated user is either an ADMIN or the owner of the cafe.
     * Throws AccessDeniedException if neither condition is met.
     */
    private void verifyOwnerOrAdmin(Long cafeId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return;
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));
        if (!cafe.getOwner().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to modify this cafe");
        }
    }

    @Override
    public CafeResponse getMyCafe() {

        Cafe cafe = getCurrentOwner().getCafe();

        return CafeResponse.builder()
                .id(cafe.getId())
                .name(cafe.getName())
                .description(cafe.getDescription())

                .address(cafe.getAddress())
                .city(cafe.getCity())
                .state(cafe.getState())
                .pincode(cafe.getPincode())

                .phoneNumber(cafe.getPhoneNumber())
                .email(cafe.getEmail())


                .openTime(cafe.getOpenTime())
                .closeTime(cafe.getCloseTime())


                .fssaiNumber(cafe.getFssaiNumber())
                .gstNumber(cafe.getGstNumber())
                .msmeNumber(cafe.getMsmeNumber())


                .logoUrl(cafe.getLogoUrl())
                .coverUrl(cafe.getCoverUrl())

                .galleryImages(
                        cafe.getGalleryImages()
                                .stream()
                                .map(CafeGallery::getImageUrl)
                                .toList()
                )

                .isActive(cafe.getIsActive())
                .createdAt(cafe.getCreatedAt())

                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PublicCafeCardResponse> getPublicActiveCafes(Pageable pageable) {
        Page<Cafe> cafesPage = cafeRepository.findByIsActiveTrue(pageable);
        List<PublicCafeCardResponse> responses = cafesPage.getContent().stream()
                .map(cafe -> PublicCafeCardResponse.builder()
                        .id(cafe.getId())
                        .name(cafe.getName())
                        .description(cafe.getDescription())
                        .city(cafe.getCity())
                        .state(cafe.getState())
                        .openTime(cafe.getOpenTime())
                        .closeTime(cafe.getCloseTime())
                        .rating(cafe.getRating())
                        .logoUrl(cafe.getLogoUrl())
                        .imageUrl(cafe.getLogoUrl())  // imageUrl = logo for card display
                        .build())
                .toList();

        return PageResponse.<PublicCafeCardResponse>builder()
                .content(responses)
                .pageNumber(cafesPage.getNumber())
                .pageSize(cafesPage.getSize())
                .totalElements(cafesPage.getTotalElements())
                .totalPages(cafesPage.getTotalPages())
                .isLast(cafesPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PublicCafeDetailResponse getPublicCafeDetails(Long cafeId) {
        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found"));

        if (!cafe.getIsActive()) {
            throw new BadRequestException("This cafe is currently not active");
        }

        // Fetch active menu items for this cafe
        List<PublicCafeDetailResponse.PublicMenuItemResponse> menuItems =
                menuItemRepository.findByCafeIdAndIsAvailableTrueAndIsDeletedFalse(cafe.getId())
                        .stream()
                        .map(mi -> PublicCafeDetailResponse.PublicMenuItemResponse.builder()
                                .id(mi.getId())
                                .name(mi.getName())
                                .description(mi.getDescription())
                                .category(mi.getCategory() != null ? mi.getCategory().name() : "OTHER")
                                .price(mi.getPrice())
                                .imageUrl(mi.getImageUrl())
                                .available(mi.getIsAvailable())
                                .build())
                        .toList();

        return PublicCafeDetailResponse.builder()
                .id(cafe.getId())
                .name(cafe.getName())
                .description(cafe.getDescription())
                .address(cafe.getAddress())
                .city(cafe.getCity())
                .state(cafe.getState())
                .pincode(cafe.getPincode())
                .phoneNumber(cafe.getPhoneNumber())
                .email(cafe.getEmail())
                .openTime(cafe.getOpenTime())
                .closeTime(cafe.getCloseTime())
                .rating(cafe.getRating())
                .logoUrl(cafe.getLogoUrl())
                .coverUrl(cafe.getCoverUrl())
                .galleryImages(cafe.getGalleryImages().stream().map(CafeGallery::getImageUrl).toList())
                .menuItems(menuItems)
                .createdAt(cafe.getCreatedAt())
                .build();
    }
}
