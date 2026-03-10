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


    private Cafe getCafeByOwner(Long ownerId) {
        List<Cafe> cafes = cafeRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId);
        if (cafes.isEmpty()) {
            throw new ResourceNotFoundException("Cafe not found for owner ID: " + ownerId);
        }
        return cafes.get(0);
    }


    @Override
    public TableResponse createTableForOwner(Long ownerId, TableRequest request) {
        log.info("Creating table for owner ID: {}", ownerId);

        Cafe cafe = getCafeByOwner(ownerId);

        CafeTable table = tableMapper.toEntity(request);
        table.setCafe(cafe);
        // Use the owner-provided number when supplied; otherwise auto-assign sequentially
        if (request.getTableNumber() == null || request.getTableNumber().isBlank()) {
            long count = tableRepository.countByCafeId(cafe.getId());
            table.setTableNumber("T" + (count + 1));
        } else {
            table.setTableNumber(request.getTableNumber().trim());
        }
        table.setIsAvailable(true);

        CafeTable saved = tableRepository.save(table);

        log.info("Table created successfully with ID: {}", saved.getId());
        return tableMapper.toResponse(saved);
    }


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


    @Override
    @Transactional(readOnly = true)
    public List<TableResponse> getAvailableTablesForOwner(Long ownerId) {
        log.info("Fetching available tables for owner ID: {}", ownerId);

        Cafe cafe = getCafeByOwner(ownerId);

        return tableRepository.findByCafeIdAndIsAvailable(cafe.getId(), true)
                .stream()
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }


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


    @Override
    public void deleteTable(Long tableId) {
        log.info("Deleting table with ID: {}", tableId);

        if (!tableRepository.existsById(tableId)) {
            throw new ResourceNotFoundException("Table not found with ID: " + tableId);
        }

        tableRepository.deleteById(tableId);
        log.info("Table deleted successfully");
    }


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

    @Override
    public TableResponse getTableById(Long tableId) {
        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table", "id", tableId));
        return tableMapper.toResponse(table);
    }

    @Override
    public List<TableResponse> getAllTables() {
        return tableRepository.findAll().stream()
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TableResponse> getAvailableTables(Long cafeId, java.time.LocalDateTime bookingTime) {
        return getAvailableTables(cafeId, bookingTime, 1);
    }

    @Override
    public List<TableResponse> getAvailableTables(Long cafeId, java.time.LocalDateTime bookingTime, Integer seatsRequired) {
        int requiredSeats = (seatsRequired != null && seatsRequired > 0) ? seatsRequired : 1;
        return tableRepository.findByCafeIdAndIsAvailable(cafeId, true).stream()
                .filter(t -> t.getCapacity() != null && t.getCapacity() >= requiredSeats)
                .map(tableMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TableResponse createTable(Long cafeId, TableRequest request) {
        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", cafeId));
        CafeTable table = tableMapper.toEntity(request);
        table.setCafe(cafe);
        if (request.getTableNumber() == null || request.getTableNumber().isBlank()) {
            long count = tableRepository.countByCafeId(cafe.getId());
            table.setTableNumber("T" + (count + 1));
        } else {
            table.setTableNumber(request.getTableNumber().trim());
        }
        CafeTable saved = tableRepository.save(table);
        return tableMapper.toResponse(saved);
    }
}
