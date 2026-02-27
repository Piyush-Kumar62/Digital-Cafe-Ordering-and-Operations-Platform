package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.MenuItemRequest;
import com.digitalcafe.dto.response.MenuItemResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.MenuItem;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.MenuItemMapper;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.MenuItemRepository;
import com.digitalcafe.service.MenuItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of MenuItemService for managing menu item operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CafeRepository cafeRepository;
    private final MenuItemMapper menuItemMapper;

    @Override
    @Transactional
    public MenuItemResponse createMenuItem(Long cafeId, MenuItemRequest request) {
        log.info("Creating menu item for cafe ID: {}", cafeId);

        Cafe cafe = cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found with ID: " + cafeId));

        MenuItem menuItem = menuItemMapper.toEntity(request);
        menuItem.setCafe(cafe);
        menuItem.setIsAvailable(true);

        MenuItem savedMenuItem = menuItemRepository.save(menuItem);
        log.info("Menu item created successfully with ID: {}", savedMenuItem.getId());

        return menuItemMapper.toResponse(savedMenuItem);
    }

    @Override
    @Transactional
    public MenuItemResponse updateMenuItem(Long menuItemId, MenuItemRequest request) {
        log.info("Updating menu item with ID: {}", menuItemId);

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with ID: " + menuItemId));

        menuItemMapper.updateMenuItemFromRequest(request, menuItem);
        MenuItem updatedMenuItem = menuItemRepository.save(menuItem);

        log.info("Menu item updated successfully with ID: {}", menuItemId);
        return menuItemMapper.toResponse(updatedMenuItem);
    }

    @Override
    @Transactional(readOnly = true)
    public MenuItemResponse getMenuItemById(Long menuItemId) {
        log.info("Fetching menu item with ID: {}", menuItemId);

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with ID: " + menuItemId));

        return menuItemMapper.toResponse(menuItem);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getMenuItemsByCafeId(Long cafeId) {
        log.info("Fetching all menu items for cafe ID: {}", cafeId);

        List<MenuItem> menuItems = menuItemRepository.findByCafeId(cafeId);
        return menuItems.stream()
                .map(menuItemMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemResponse> getAvailableMenuItemsByCafeId(Long cafeId) {
        log.info("Fetching available menu items for cafe ID: {}", cafeId);

        List<MenuItem> menuItems = menuItemRepository.findByCafeIdAndIsAvailableTrue(cafeId);
        return menuItems.stream()
                .map(menuItemMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MenuItemResponse> getAllMenuItems(Pageable pageable) {
        log.info("Fetching all menu items with pagination");

        Page<MenuItem> menuItemPage = menuItemRepository.findAll(pageable);
        List<MenuItemResponse> menuItemResponses = menuItemPage.getContent().stream()
                .map(menuItemMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<MenuItemResponse>builder()
                .content(menuItemResponses)
                .pageNumber(menuItemPage.getNumber())
                .pageSize(menuItemPage.getSize())
                .totalElements(menuItemPage.getTotalElements())
                .totalPages(menuItemPage.getTotalPages())
                .isLast(menuItemPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public void deleteMenuItem(Long menuItemId) {
        log.info("Deleting menu item with ID: {}", menuItemId);

        if (!menuItemRepository.existsById(menuItemId)) {
            throw new ResourceNotFoundException("Menu item not found with ID: " + menuItemId);
        }

        menuItemRepository.deleteById(menuItemId);
        log.info("Menu item deleted successfully with ID: {}", menuItemId);
    }

    @Override
    @Transactional
    public MenuItemResponse toggleAvailability(Long menuItemId, boolean isAvailable) {
        log.info("Toggling menu item availability for ID: {} to {}", menuItemId, isAvailable);

        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with ID: " + menuItemId));

        menuItem.setIsAvailable(isAvailable);
        MenuItem updatedMenuItem = menuItemRepository.save(menuItem);

        log.info("Menu item availability updated successfully");
        return menuItemMapper.toResponse(updatedMenuItem);
    }
}

