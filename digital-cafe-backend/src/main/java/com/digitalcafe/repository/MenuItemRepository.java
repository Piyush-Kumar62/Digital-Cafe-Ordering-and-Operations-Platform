package com.digitalcafe.repository;

import com.digitalcafe.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategoryId(Long categoryId);
    List<MenuItem> findByCafeId(Long cafeId);
    List<MenuItem> findByCafeIdAndCategoryId(Long cafeId, Long categoryId);
    List<MenuItem> findByAvailableAndActive(Boolean available, Boolean active);
    
    // Dashboard queries
    Long countByCafeId(Long cafeId);
}
