package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.TableRequest;
import com.digitalcafe.dto.response.TableResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.CafeTable;
import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.AccessDeniedException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.TableMapper;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.CafeTableRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.BookingService;
import com.digitalcafe.service.TableService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private final CafeTableRepository tableRepository;
    private final CafeRepository cafeRepository;
    private final UserRepository userRepository;
    private final TableMapper tableMapper;
    private final BookingService bookingService;

    @Override
    @Transactional
    public TableResponse createTable(Long cafeId, TableRequest request) {
        log.info("Creating table for cafe ID: {}", cafeId);
        validateCafeOwnerAccess(cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));

        CafeTable table = tableMapper.toEntity(request);
        table.setCafe(cafe);
        table.setIsAvailable(true);

        CafeTable savedTable = tableRepository.save(table);
        log.info("Table created successfully with ID: {}", savedTable.getId());

        return tableMapper.toResponse(savedTable);
    }

    @Override
    @Transactional
    public TableResponse updateTable(Long tableId, TableRequest request) {
        log.info("Updating table with ID: {}", tableId);

        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + tableId));
        validateCafeOwnerAccess(table.getCafe().getId());

        tableMapper.updateTableFromRequest(request, table);
        CafeTable updatedTable = tableRepository.save(table);

        log.info("Table updated successfully with ID: {}", tableId);
        return tableMapper.toResponse(updatedTable);
    }

    @Override
    @Transactional(readOnly = true)
    public TableResponse getTableById(Long tableId) {
        log.info("Fetching table with ID: {}", tableId);

        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + tableId));

        return tableMapper.toResponse(table);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getTablesByCafeId(Long cafeId) {
        log.info("Fetching all tables for cafe ID: {}", cafeId);

        List<CafeTable> tables = tableRepository.findByCafeId(cafeId);
        return tables.stream()
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAllTables() {
        User actor = getAuthenticatedUser();
        if (actor.hasRole(Role.RoleName.ADMIN)) {
            return tableRepository.findAll().stream()
                    .map(tableMapper::toResponse)
                    .collect(Collectors.toList());
        }
        if (actor.hasRole(Role.RoleName.CAFE_OWNER)) {
            Long actorCafeId = getAssignedCafeId(actor);
            return tableRepository.findByCafeId(actorCafeId).stream()
                    .map(tableMapper::toResponse)
                    .collect(Collectors.toList());
        }
        throw new AccessDeniedException("You are not allowed to view all tables");
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTables(Long cafeId, LocalDateTime bookingTime) {
        log.info("Fetching available tables for cafe ID: {} at time: {}", cafeId, bookingTime);

        List<CafeTable> tables = tableRepository.findByCafeIdAndIsAvailable(cafeId, true);

        return tables.stream()
                .filter(table -> bookingService.isTableAvailable(table.getId(), bookingTime))
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTables(Long cafeId, LocalDateTime bookingTime, Integer seatsRequired) {
        log.info("Fetching available tables for cafe ID: {} at time: {} with seats: {}", cafeId, bookingTime, seatsRequired);

        List<CafeTable> tables = tableRepository.findByCafeIdAndIsAvailable(cafeId, true);

        return tables.stream()
                .filter(table -> seatsRequired == null || table.getCapacity() >= seatsRequired)
                .filter(table -> bookingService.isTableAvailable(table.getId(), bookingTime))
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTable(Long tableId) {
        log.info("Deleting table with ID: {}", tableId);

        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + tableId));
        validateCafeOwnerAccess(table.getCafe().getId());

        tableRepository.deleteById(tableId);
        log.info("Table deleted successfully with ID: {}", tableId);
    }

    @Override
    @Transactional
    public TableResponse toggleAvailability(Long tableId, boolean isAvailable) {
        log.info("Toggling table availability for ID: {} to {}", tableId, isAvailable);

        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + tableId));
        validateCafeOwnerAccess(table.getCafe().getId());

        table.setIsAvailable(isAvailable);
        CafeTable updatedTable = tableRepository.save(table);

        log.info("Table availability updated successfully");
        return tableMapper.toResponse(updatedTable);
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
            throw new AccessDeniedException("Only cafe owner can manage tables");
        }
        Long actorCafeId = getAssignedCafeId(actor);
        if (!actorCafeId.equals(cafeId)) {
            throw new AccessDeniedException("Cafe owner cannot manage tables from another cafe");
        }
    }

    private Long getAssignedCafeId(User user) {
        if (user.getCafe() == null || user.getCafe().getId() == null) {
            throw new AccessDeniedException("Authenticated user is not assigned to any cafe");
        }
        return user.getCafe().getId();
    }
}
