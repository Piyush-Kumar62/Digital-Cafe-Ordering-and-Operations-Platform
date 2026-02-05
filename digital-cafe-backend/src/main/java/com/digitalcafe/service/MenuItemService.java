package com.digitalcafe.service;

import com.digitalcafe.dto.MenuItemDTO;
import com.digitalcafe.dto.MenuItemRequestDTO;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.model.Cafe;
import com.digitalcafe.model.Category;
import com.digitalcafe.model.MenuItem;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.CategoryRepository;
import com.digitalcafe.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final CafeRepository cafeRepository;

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getAllMenuItems() {
        return menuItemRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MenuItemDTO getMenuItemById(Long id) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));
        return convertToDTO(menuItem);
    }

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getMenuItemsByCafe(Long cafeId) {
        return menuItemRepository.findByCafeId(cafeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getMenuItemsByCategory(Long categoryId) {
        return menuItemRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuItemDTO> getAvailableMenuItems() {
        return menuItemRepository.findByAvailableAndActive(true, true).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MenuItemDTO createMenuItem(MenuItemRequestDTO requestDTO) {
        Category category = categoryRepository.findById(requestDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", requestDTO.getCategoryId()));

        Cafe cafe = cafeRepository.findById(requestDTO.getCafeId())
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", requestDTO.getCafeId()));

        MenuItem menuItem = new MenuItem();
        menuItem.setName(requestDTO.getName());
        menuItem.setDescription(requestDTO.getDescription());
        menuItem.setPrice(requestDTO.getPrice());
        menuItem.setCategory(category);
        menuItem.setCafe(cafe);
        menuItem.setImageUrl(requestDTO.getImageUrl());
        menuItem.setAvailable(requestDTO.getAvailable());
        menuItem.setActive(true);

        MenuItem savedMenuItem = menuItemRepository.save(menuItem);
        return convertToDTO(savedMenuItem);
    }

    @Transactional
    public MenuItemDTO updateMenuItem(Long id, MenuItemRequestDTO requestDTO) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));

        Category category = categoryRepository.findById(requestDTO.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", requestDTO.getCategoryId()));

        Cafe cafe = cafeRepository.findById(requestDTO.getCafeId())
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", requestDTO.getCafeId()));

        menuItem.setName(requestDTO.getName());
        menuItem.setDescription(requestDTO.getDescription());
        menuItem.setPrice(requestDTO.getPrice());
        menuItem.setCategory(category);
        menuItem.setCafe(cafe);
        menuItem.setImageUrl(requestDTO.getImageUrl());
        menuItem.setAvailable(requestDTO.getAvailable());

        MenuItem updatedMenuItem = menuItemRepository.save(menuItem);
        return convertToDTO(updatedMenuItem);
    }

    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));
        menuItemRepository.delete(menuItem);
    }

    @Transactional
    public MenuItemDTO toggleAvailability(Long id) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", id));
        menuItem.setAvailable(!menuItem.getAvailable());
        MenuItem updatedMenuItem = menuItemRepository.save(menuItem);
        return convertToDTO(updatedMenuItem);
    }

    private MenuItemDTO convertToDTO(MenuItem menuItem) {
        MenuItemDTO dto = new MenuItemDTO();
        dto.setId(menuItem.getId());
        dto.setName(menuItem.getName());
        dto.setDescription(menuItem.getDescription());
        dto.setPrice(menuItem.getPrice());
        dto.setCategoryId(menuItem.getCategory().getId());
        dto.setCategoryName(menuItem.getCategory().getName());
        dto.setCafeId(menuItem.getCafe().getId());
        dto.setCafeName(menuItem.getCafe().getName());
        dto.setImageUrl(menuItem.getImageUrl());
        dto.setAvailable(menuItem.getAvailable());
        dto.setActive(menuItem.getActive());
        return dto;
    }
}
