package com.digitalcafe.controller;

import com.digitalcafe.dto.request.TableRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.TableResponse;
import com.digitalcafe.security.CustomUserPrincipal;
import com.digitalcafe.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for cafe table management.
 * Uses logged-in Cafe Owner to resolve cafe automatically.
 */
@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    /**
     * Create new table for logged-in owner's cafe
     */
    @PostMapping("/my")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<TableResponse>> createTable(
            Authentication authentication,
            @Valid @RequestBody TableRequest request) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        Long ownerId = user.getId();

        TableResponse response = tableService.createTableForOwner(ownerId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Table created successfully", response));
    }

    /**
     * Get all tables of logged-in owner's cafe
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getMyTables(Authentication authentication) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        Long ownerId = user.getId();

        List<TableResponse> response = tableService.getTablesForOwner(ownerId);

        return ResponseEntity.ok(ApiResponse.success("Tables retrieved successfully", response));
    }

    /**
     * Get only available tables
     */
    @GetMapping("/my/available")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAvailableTables(Authentication authentication) {

        CustomUserPrincipal user = (CustomUserPrincipal) authentication.getPrincipal();
        Long ownerId = user.getId();

        List<TableResponse> response = tableService.getAvailableTablesForOwner(ownerId);

        return ResponseEntity.ok(ApiResponse.success("Available tables retrieved successfully", response));
    }

    /**
     * Update table details (capacity, number, type, etc.)
     */
    @PutMapping("/{tableId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<TableResponse>> updateTable(
            @PathVariable Long tableId,
            @Valid @RequestBody TableRequest request) {

        TableResponse response = tableService.updateTable(tableId, request);

        return ResponseEntity.ok(ApiResponse.success("Table updated successfully", response));
    }

    /**
     * Toggle table availability (OPEN / OCCUPIED)
     */
    @PatchMapping("/{tableId}/availability")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<TableResponse>> toggleAvailability(
            @PathVariable Long tableId,
            @RequestParam boolean isAvailable) {

        TableResponse response = tableService.toggleAvailability(tableId, isAvailable);

        return ResponseEntity.ok(ApiResponse.success("Table availability updated successfully", response));
    }

    /**
     * Delete table
     */
    @DeleteMapping("/{tableId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable Long tableId) {

        tableService.deleteTable(tableId);

        return ResponseEntity.ok(ApiResponse.success("Table deleted successfully", null));
    }

    @GetMapping("/cafe/{cafeId}")
    @PreAuthorize("hasAnyRole('CAFE_OWNER','ADMIN')")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getTablesByCafeId(
            @PathVariable Long cafeId) {

        List<TableResponse> tables = tableService.getTablesByCafeId(cafeId);

        return ResponseEntity.ok(
                ApiResponse.success("Tables retrieved successfully", tables)
        );
    }
}