package com.digitalcafe.controller;

import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.MenuItemResponse;
import com.digitalcafe.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuItemService menuItemService;

    @GetMapping("/{cafeId}")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getMenuByCafe(@PathVariable Long cafeId) {
        List<MenuItemResponse> response = menuItemService.getAvailableMenuItemsByCafeId(cafeId);
        return ResponseEntity.ok(ApiResponse.success("Menu items retrieved successfully", response));
    }

    @GetMapping("/item/{id}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getMenuItemById(@PathVariable Long id) {
        MenuItemResponse response = menuItemService.getMenuItemById(id);
        return ResponseEntity.ok(ApiResponse.success("Menu item retrieved successfully", response));
    }
}

