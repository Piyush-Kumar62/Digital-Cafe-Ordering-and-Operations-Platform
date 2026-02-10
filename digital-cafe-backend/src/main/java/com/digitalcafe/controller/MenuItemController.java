package com.digitalcafe.controller;

import com.digitalcafe.dto.request.MenuItemRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.MenuItemResponse;
import com.digitalcafe.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for menu item management operations.
 */
@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;

    @PostMapping("/cafe/{cafeId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createMenuItem(
            @PathVariable Long cafeId,
            @Valid @RequestBody MenuItemRequest request) {
        MenuItemResponse response = menuItemService.createMenuItem(cafeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Menu item created successfully", response));
    }

    @PutMapping("/{menuItemId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateMenuItem(
            @PathVariable Long menuItemId,
            @Valid @RequestBody MenuItemRequest request) {
        MenuItemResponse response = menuItemService.updateMenuItem(menuItemId, request);
        return ResponseEntity.ok(ApiResponse.success("Menu item updated successfully", response));
    }

    @GetMapping("/{menuItemId}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getMenuItemById(@PathVariable Long menuItemId) {
        MenuItemResponse response = menuItemService.getMenuItemById(menuItemId);
        return ResponseEntity.ok(ApiResponse.success("Menu item retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getMenuItemsByCafeId(@PathVariable Long cafeId) {
        List<MenuItemResponse> response = menuItemService.getMenuItemsByCafeId(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Menu items retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}/available")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getAvailableMenuItems(@PathVariable Long cafeId) {
        List<MenuItemResponse> response = menuItemService.getAvailableMenuItemsByCafeId(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Available menu items retrieved successfully", response));
    }

    @DeleteMapping("/{menuItemId}")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteMenuItem(@PathVariable Long menuItemId) {
        menuItemService.deleteMenuItem(menuItemId);
        return ResponseEntity.ok(ApiResponse.success("Menu item deleted successfully", null));
    }

    @PatchMapping("/{menuItemId}/availability")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> toggleAvailability(
            @PathVariable Long menuItemId,
            @RequestParam boolean isAvailable) {
        MenuItemResponse response = menuItemService.toggleAvailability(menuItemId, isAvailable);
        return ResponseEntity.ok(ApiResponse.success("Menu item availability updated successfully", response));
    }
}

