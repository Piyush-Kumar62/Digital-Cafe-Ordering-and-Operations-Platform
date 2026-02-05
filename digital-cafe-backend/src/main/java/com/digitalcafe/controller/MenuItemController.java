package com.digitalcafe.controller;

import com.digitalcafe.dto.MenuItemDTO;
import com.digitalcafe.dto.MenuItemRequestDTO;
import com.digitalcafe.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu-items")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MenuItemController {

    private final MenuItemService menuItemService;

    @GetMapping
    public ResponseEntity<List<MenuItemDTO>> getAllMenuItems() {
        List<MenuItemDTO> menuItems = menuItemService.getAllMenuItems();
        return ResponseEntity.ok(menuItems);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItemDTO> getMenuItemById(@PathVariable Long id) {
        MenuItemDTO menuItem = menuItemService.getMenuItemById(id);
        return ResponseEntity.ok(menuItem);
    }

    @GetMapping("/cafe/{cafeId}")
    public ResponseEntity<List<MenuItemDTO>> getMenuItemsByCafe(@PathVariable Long cafeId) {
        List<MenuItemDTO> menuItems = menuItemService.getMenuItemsByCafe(cafeId);
        return ResponseEntity.ok(menuItems);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<MenuItemDTO>> getMenuItemsByCategory(@PathVariable Long categoryId) {
        List<MenuItemDTO> menuItems = menuItemService.getMenuItemsByCategory(categoryId);
        return ResponseEntity.ok(menuItems);
    }

    @GetMapping("/available")
    public ResponseEntity<List<MenuItemDTO>> getAvailableMenuItems() {
        List<MenuItemDTO> menuItems = menuItemService.getAvailableMenuItems();
        return ResponseEntity.ok(menuItems);
    }

    @PostMapping
    public ResponseEntity<MenuItemDTO> createMenuItem(
            @Valid @RequestBody MenuItemRequestDTO menuItemRequestDTO) {
        MenuItemDTO createdMenuItem = menuItemService.createMenuItem(menuItemRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMenuItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItemDTO> updateMenuItem(
            @PathVariable Long id,
            @Valid @RequestBody MenuItemRequestDTO menuItemRequestDTO) {
        MenuItemDTO updatedMenuItem = menuItemService.updateMenuItem(id, menuItemRequestDTO);
        return ResponseEntity.ok(updatedMenuItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long id) {
        menuItemService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-availability")
    public ResponseEntity<MenuItemDTO> toggleAvailability(@PathVariable Long id) {
        MenuItemDTO menuItem = menuItemService.toggleAvailability(id);
        return ResponseEntity.ok(menuItem);
    }
}
