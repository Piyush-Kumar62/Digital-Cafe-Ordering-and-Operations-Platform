package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.dto.response.PublicCafeCardResponse;
import com.digitalcafe.dto.response.PublicCafeDetailResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.MenuItem;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.AccessDeniedException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.CafeMapper;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.MenuItemRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.CafeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of CafeService for managing cafe operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CafeServiceImpl implements CafeService {

    private final CafeRepository cafeRepository;
    private final UserRepository userRepository;
    private final MenuItemRepository menuItemRepository;
    private final CafeMapper cafeMapper;

    @Override
    @Transactional
    public CafeResponse createCafe(Long ownerId, CafeRequest request) {
        log.info("Creating cafe for owner ID: {}", ownerId);

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe owner not found with ID: " + ownerId));

        Cafe cafe = cafeMapper.toEntity(request);
        cafe.setOwner(owner);
        cafe.setIsActive(true);

        Cafe savedCafe = cafeRepository.save(cafe);
        log.info("Cafe created successfully with ID: {}", savedCafe.getId());

        return cafeMapper.toResponse(savedCafe);
    }

    @Override
    @Transactional
    public CafeResponse updateCafe(Long cafeId, CafeRequest request) {
        log.info("Updating cafe with ID: {}", cafeId);
        validateCafeOwnerAccess(cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));

        cafeMapper.updateCafeFromRequest(request, cafe);
        Cafe updatedCafe = cafeRepository.save(cafe);

        log.info("Cafe updated successfully with ID: {}", cafeId);
        return cafeMapper.toResponse(updatedCafe);
    }

    @Override
    @Transactional(readOnly = true)
    public CafeResponse getCafeById(Long cafeId) {
        log.info("Fetching cafe with ID: {}", cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));
        validateCafeReadAccess(cafe);

        return cafeMapper.toResponse(cafe);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CafeResponse> getAllCafes(Pageable pageable) {
        log.info("Fetching all cafes with pagination");
        User actor = getAuthenticatedUser();
        Page<Cafe> cafePage;
        if (actor.hasRole(Role.RoleName.ADMIN)) {
            cafePage = cafeRepository.findAll(pageable);
        } else if (actor.hasRole(Role.RoleName.CAFE_OWNER)) {
            List<Cafe> ownCafes = cafeRepository.findByOwnerId(actor.getId());
            cafePage = new PageImpl<>(ownCafes);
        } else {
            throw new AccessDeniedException("You are not allowed to view all cafes");
        }
        List<CafeResponse> cafeResponses = cafePage.getContent().stream()
                .map(cafeMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<CafeResponse>builder()
                .content(cafeResponses)
                .pageNumber(cafePage.getNumber())
                .pageSize(cafePage.getSize())
                .totalElements(cafePage.getTotalElements())
                .totalPages(cafePage.getTotalPages())
                .isLast(cafePage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PublicCafeCardResponse> getPublicActiveCafes(Pageable pageable) {
        Page<Cafe> cafePage = cafeRepository.findByIsActive(true, pageable);
        List<PublicCafeCardResponse> content = cafePage.getContent().stream()
                .map(this::toPublicCafeCard)
                .collect(Collectors.toList());

        return PageResponse.<PublicCafeCardResponse>builder()
                .content(content)
                .pageNumber(cafePage.getNumber())
                .pageSize(cafePage.getSize())
                .totalElements(cafePage.getTotalElements())
                .totalPages(cafePage.getTotalPages())
                .isFirst(cafePage.isFirst())
                .isLast(cafePage.isLast())
                .hasNext(cafePage.hasNext())
                .hasPrevious(cafePage.hasPrevious())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PublicCafeDetailResponse getPublicCafeDetails(Long cafeId) {
        Cafe cafe = cafeRepository.findByIdAndIsActiveTrue(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Active cafe not found with ID: " + cafeId));
        List<MenuItem> menuItems = menuItemRepository.findByCafeIdAndIsAvailableTrueAndIsDeletedFalseOrderByCategoryAscNameAsc(cafeId);

        return PublicCafeDetailResponse.builder()
                .cafeDetails(toPublicCafeCard(cafe))
                .menuItems(menuItems.stream()
                        .map(item -> PublicCafeDetailResponse.PublicMenuItemResponse.builder()
                                .id(item.getId())
                                .name(item.getName())
                                .description(item.getDescription())
                                .category(item.getCategory() != null ? item.getCategory().name() : null)
                                .price(item.getPrice())
                                .imageUrl(item.getImageUrl())
                                .available(Boolean.TRUE.equals(item.getIsAvailable()))
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CafeResponse> getActiveCafes() {
        log.info("Fetching all active cafes");

        List<Cafe> cafes = cafeRepository.findByIsActive(true);
        return cafes.stream()
                .map(cafeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CafeResponse> getCafesByOwnerId(Long ownerId) {
        log.info("Fetching cafes for owner ID: {}", ownerId);
        validateOwnerScopedAccess(ownerId);

        List<Cafe> cafes = cafeRepository.findByOwnerId(ownerId);
        return cafes.stream()
                .map(cafeMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteCafe(Long cafeId) {
        log.info("Deleting cafe with ID: {}", cafeId);

        if (!cafeRepository.existsById(cafeId)) {
            throw new ResourceNotFoundException("Cafe not found with ID: " + cafeId);
        }

        cafeRepository.deleteById(cafeId);
        log.info("Cafe deleted successfully with ID: {}", cafeId);
    }

    @Override
    @Transactional
    public CafeResponse toggleCafeStatus(Long cafeId, boolean isActive) {
        log.info("Toggling cafe status for ID: {} to {}", cafeId, isActive);
        validateCafeOwnerAccess(cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));

        cafe.setIsActive(isActive);
        Cafe updatedCafe = cafeRepository.save(cafe);

        log.info("Cafe status updated successfully");
        return cafeMapper.toResponse(updatedCafe);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Unauthenticated access");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found"));
    }

    private void validateCafeOwnerAccess(Long cafeId) {
        User actor = getAuthenticatedUser();
        if (actor.hasRole(Role.RoleName.ADMIN)) {
            return;
        }
        if (!actor.hasRole(Role.RoleName.CAFE_OWNER)) {
            throw new AccessDeniedException("Only cafe owner can manage cafe details");
        }
        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));
        if (cafe.getOwner() == null || !actor.getId().equals(cafe.getOwner().getId())) {
            throw new AccessDeniedException("Cafe owner cannot manage another cafe");
        }
    }

    private void validateOwnerScopedAccess(Long ownerId) {
        User actor = getAuthenticatedUser();
        if (actor.hasRole(Role.RoleName.ADMIN)) {
            return;
        }
        if (!actor.hasRole(Role.RoleName.CAFE_OWNER) || !actor.getId().equals(ownerId)) {
            throw new AccessDeniedException("Cafe owner cannot access another owner's cafe list");
        }
    }

    private void validateCafeReadAccess(Cafe cafe) {
        User actor = getAuthenticatedUser();
        if (actor.hasRole(Role.RoleName.CAFE_OWNER)
                && (cafe.getOwner() == null || !actor.getId().equals(cafe.getOwner().getId()))) {
            throw new AccessDeniedException("Cafe owner cannot access another cafe");
        }
    }

    private PublicCafeCardResponse toPublicCafeCard(Cafe cafe) {
        String location = String.join(", ",
                java.util.stream.Stream.of(cafe.getCity(), cafe.getState())
                        .filter(v -> v != null && !v.isBlank())
                        .toList());
        return PublicCafeCardResponse.builder()
                .id(cafe.getId())
                .name(cafe.getName())
                .location(location)
                .description(cafe.getDescription())
                .openTime(cafe.getOpeningTime())
                .closeTime(cafe.getClosingTime())
                .rating(cafe.getRating())
                .imageUrl(cafe.getImageUrl())
                .build();
    }
}
