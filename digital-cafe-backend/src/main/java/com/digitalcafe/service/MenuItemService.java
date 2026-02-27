package com.digitalcafe.service;

import com.digitalcafe.dto.request.MenuItemRequest;
import com.digitalcafe.dto.response.MenuItemResponse;
import com.digitalcafe.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for menu item management operations.
 */
public interface MenuItemService {

    /**
     * Create a new menu item for a cafe
     */
    MenuItemResponse createMenuItem(Long cafeId, MenuItemRequest request);

    /**
     * Update an existing menu item
     */
    MenuItemResponse updateMenuItem(Long menuItemId, MenuItemRequest request);

    /**
     * Get menu item by ID
     */
    MenuItemResponse getMenuItemById(Long menuItemId);

    /**
     * Get all menu items for a specific cafe
     */
    List<MenuItemResponse> getMenuItemsByCafeId(Long cafeId);

    /**
     * Get available menu items for a specific cafe
     */
    List<MenuItemResponse> getAvailableMenuItemsByCafeId(Long cafeId);

    /**
     * Get all menu items with pagination
     */
    PageResponse<MenuItemResponse> getAllMenuItems(Pageable pageable);

    /**
     * Delete a menu item
     */
    void deleteMenuItem(Long menuItemId);

    /**
     * Toggle menu item availability
     */
    MenuItemResponse toggleAvailability(Long menuItemId, boolean isAvailable);
}

