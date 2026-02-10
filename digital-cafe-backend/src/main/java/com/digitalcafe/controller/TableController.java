package com.digitalcafe.controller;

import com.digitalcafe.dto.request.TableRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.TableResponse;
import com.digitalcafe.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST controller for cafe table management operations.
 */
@RestController
@RequestMapping("/api/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    @PostMapping("/cafe/{cafeId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<TableResponse>> createTable(
            @PathVariable Long cafeId,
            @Valid @RequestBody TableRequest request) {
        TableResponse response = tableService.createTable(cafeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Table created successfully", response));
    }

    @PutMapping("/{tableId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<TableResponse>> updateTable(
            @PathVariable Long tableId,
            @Valid @RequestBody TableRequest request) {
        TableResponse response = tableService.updateTable(tableId, request);
        return ResponseEntity.ok(ApiResponse.success("Table updated successfully", response));
    }

    @GetMapping("/{tableId}")
    public ResponseEntity<ApiResponse<TableResponse>> getTableById(@PathVariable Long tableId) {
        TableResponse response = tableService.getTableById(tableId);
        return ResponseEntity.ok(ApiResponse.success("Table retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getTablesByCafeId(@PathVariable Long cafeId) {
        List<TableResponse> response = tableService.getTablesByCafeId(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Tables retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}/available")
    public ResponseEntity<ApiResponse<List<TableResponse>>> getAvailableTables(
            @PathVariable Long cafeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime bookingTime) {
        List<TableResponse> response = tableService.getAvailableTables(cafeId, bookingTime);
        return ResponseEntity.ok(ApiResponse.success("Available tables retrieved successfully", response));
    }

    @DeleteMapping("/{tableId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteTable(@PathVariable Long tableId) {
        tableService.deleteTable(tableId);
        return ResponseEntity.ok(ApiResponse.success("Table deleted successfully", null));
    }

    @PatchMapping("/{tableId}/availability")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<TableResponse>> toggleAvailability(
            @PathVariable Long tableId,
            @RequestParam boolean isAvailable) {
        TableResponse response = tableService.toggleAvailability(tableId, isAvailable);
        return ResponseEntity.ok(ApiResponse.success("Table availability updated successfully", response));
    }
}

