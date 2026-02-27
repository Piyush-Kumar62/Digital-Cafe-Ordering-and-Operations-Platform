package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.TableRequest;
import com.digitalcafe.dto.response.TableResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.CafeTable;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.TableMapper;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.CafeTableRepository;
import com.digitalcafe.service.TableService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TableServiceImpl implements TableService {

    private final CafeTableRepository tableRepository;
    private final CafeRepository cafeRepository;
    private final TableMapper tableMapper;

    /**
     * Resolve cafe using logged-in owner
     */
    private Cafe getCafeByOwner(Long ownerId) {
        return cafeRepository.findByOwnerId(ownerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Cafe not found for owner ID: " + ownerId));
    }

    /**
     * Create table for logged-in owner's cafe
     */
    @Override
    public TableResponse createTableForOwner(Long ownerId, TableRequest request) {
        log.info("Creating table for owner ID: {}", ownerId);

        Cafe cafe = getCafeByOwner(ownerId);

        CafeTable table = tableMapper.toEntity(request);
        table.setCafe(cafe);
        table.setTableNumber("T" + System.currentTimeMillis());
        table.setIsAvailable(true);

        CafeTable saved = tableRepository.save(table);

        log.info("Table created successfully with ID: {}", saved.getId());
        return tableMapper.toResponse(saved);
    }

    /**
     * Get all tables for owner's cafe
     */
    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getTablesForOwner(Long ownerId) {
        log.info("Fetching tables for owner ID: {}", ownerId);

        Cafe cafe = getCafeByOwner(ownerId);

        return tableRepository.findByCafeId(cafe.getId())
                .stream()
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get only available tables
     */
    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTablesForOwner(Long ownerId) {
        log.info("Fetching available tables for owner ID: {}", ownerId);

        Cafe cafe = getCafeByOwner(ownerId);

        return tableRepository.findByCafeIdAndIsAvailableTrue(cafe.getId())
                .stream()
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update table
     */
    @Override
    public TableResponse updateTable(Long tableId, TableRequest request) {
        log.info("Updating table with ID: {}", tableId);

        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Table not found with ID: " + tableId));

        tableMapper.updateTableFromRequest(request, table);

        CafeTable updated = tableRepository.save(table);

        log.info("Table updated successfully");
        return tableMapper.toResponse(updated);
    }

    /**
     * Delete table
     */
    @Override
    public void deleteTable(Long tableId) {
        log.info("Deleting table with ID: {}", tableId);

        if (!tableRepository.existsById(tableId)) {
            throw new ResourceNotFoundException("Table not found with ID: " + tableId);
        }

        tableRepository.deleteById(tableId);
        log.info("Table deleted successfully");
    }

    /**
     * Toggle availability
     */
    @Override
    public TableResponse toggleAvailability(Long tableId, boolean isAvailable) {
        log.info("Toggling availability for table ID: {} → {}", tableId, isAvailable);

        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Table not found with ID: " + tableId));

        table.setIsAvailable(isAvailable);

        CafeTable updated = tableRepository.save(table);

        log.info("Availability updated successfully");
        return tableMapper.toResponse(updated);
    }
    @Override
    public List<TableResponse> getTablesByCafeId(Long cafeId) {

        List<CafeTable> tables = tableRepository.findByCafeId(cafeId);

        return tableMapper.toResponseList(tables);
    }
}