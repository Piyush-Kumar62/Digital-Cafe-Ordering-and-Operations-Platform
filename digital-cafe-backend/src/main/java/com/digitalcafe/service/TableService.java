package com.digitalcafe.service;

import com.digitalcafe.dto.request.TableRequest;
import com.digitalcafe.dto.response.TableResponse;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service interface for cafe table management operations.
 */
public interface TableService {

    /**
     * Create a new table for a cafe
     */
    TableResponse createTable(Long cafeId, TableRequest request);

    /**
     * Update an existing table
     */
    TableResponse updateTable(Long tableId, TableRequest request);

    /**
     * Get table by ID
     */
    TableResponse getTableById(Long tableId);

    /**
     * Get all tables for a specific cafe
     */
    List<TableResponse> getTablesByCafeId(Long cafeId);

    /**
     * Get available tables for a cafe at a specific time
     */
    List<TableResponse> getAvailableTables(Long cafeId, LocalDateTime bookingTime);

    /**
     * Delete a table
     */
    void deleteTable(Long tableId);

    /**
     * Toggle table availability
     */
    TableResponse toggleAvailability(Long tableId, boolean isAvailable);
}

