package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.CafeMapper;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.CafeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        return cafeMapper.toResponse(cafe);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CafeResponse> getAllCafes(Pageable pageable) {
        log.info("Fetching all cafes with pagination");

        Page<Cafe> cafePage = cafeRepository.findAll(pageable);
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

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));

        cafe.setIsActive(isActive);
        Cafe updatedCafe = cafeRepository.save(cafe);

        log.info("Cafe status updated successfully");
        return cafeMapper.toResponse(updatedCafe);
    }
}

