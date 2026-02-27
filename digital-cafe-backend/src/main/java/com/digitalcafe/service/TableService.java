package com.digitalcafe.service;

import com.digitalcafe.dto.request.TableRequest;
import com.digitalcafe.dto.response.TableResponse;

import java.util.List;

/**
 * Service interface for cafe table management operations.
 * All operations are resolved using logged-in Cafe Owner.
 */
public interface TableService {

    /**
     * Create table for logged-in owner's cafe
     */
    TableResponse createTableForOwner(Long ownerId, TableRequest request);

    /**
     * Get all tables for logged-in owner's cafe
     */
    List<TableResponse> getTablesForOwner(Long ownerId);

    /**
     * Get only available tables for owner's cafe
     */
    List<TableResponse> getAvailableTablesForOwner(Long ownerId);

    /**
     * Update table details
     */
    TableResponse updateTable(Long tableId, TableRequest request);

    /**
     * Delete a table
     */
    void deleteTable(Long tableId);

    /**
     * Toggle availability
     */
    TableResponse toggleAvailability(Long tableId, boolean isAvailable);

    List<TableResponse> getTablesByCafeId(Long cafeId);
}