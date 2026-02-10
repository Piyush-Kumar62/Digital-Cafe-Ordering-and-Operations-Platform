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

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TableServiceImpl implements TableService {

    private final CafeTableRepository tableRepository;
    private final CafeRepository cafeRepository;
    private final TableMapper tableMapper;

    @Override
    @Transactional
    public TableResponse createTable(Long cafeId, TableRequest request) {
        log.info("Creating table for cafe ID: {}", cafeId);

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
    public List<TableResponse> getAvailableTables(Long cafeId, LocalDateTime bookingTime) {
        log.info("Fetching available tables for cafe ID: {} at time: {}", cafeId, bookingTime);

        List<CafeTable> tables = tableRepository.findByCafeIdAndIsAvailable(cafeId, true);
        // TODO: Add logic to check booking conflicts

        return tables.stream()
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTable(Long tableId) {
        log.info("Deleting table with ID: {}", tableId);

        if (!tableRepository.existsById(tableId)) {
            throw new ResourceNotFoundException("Table not found with ID: " + tableId);
        }

        tableRepository.deleteById(tableId);
        log.info("Table deleted successfully with ID: {}", tableId);
    }

    @Override
    @Transactional
    public TableResponse toggleAvailability(Long tableId, boolean isAvailable) {
        log.info("Toggling table availability for ID: {} to {}", tableId, isAvailable);

        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with ID: " + tableId));

        table.setIsAvailable(isAvailable);
        CafeTable updatedTable = tableRepository.save(table);

        log.info("Table availability updated successfully");
        return tableMapper.toResponse(updatedTable);
    }
}

