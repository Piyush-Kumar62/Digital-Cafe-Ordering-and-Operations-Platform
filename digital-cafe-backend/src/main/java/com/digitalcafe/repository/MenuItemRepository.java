package com.digitalcafe.repository;

import com.digitalcafe.entity.MenuItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCafeId(Long cafeId);
    Page<MenuItem> findByCafeId(Long cafeId, Pageable pageable);

    List<MenuItem> findByCafeIdAndIsAvailableTrue(Long cafeId);
    Page<MenuItem> findByCafeIdAndIsAvailableTrue(Long cafeId, Pageable pageable);

    List<MenuItem> findByCafeIdAndCategoryAndIsAvailableTrue(Long cafeId, MenuItem.Category category);
    Page<MenuItem> findByCafeIdAndCategory(Long cafeId, MenuItem.Category category, Pageable pageable);

    List<MenuItem> findByCafeIdAndIsVegetarianTrue(Long cafeId);
    Page<MenuItem> findByCafeIdAndIsVegetarianTrue(Long cafeId, Pageable pageable);

    Page<MenuItem> findByCafeIdAndIsVeganTrue(Long cafeId, Pageable pageable);

    Page<MenuItem> findByCafeIdAndNameContainingIgnoreCase(Long cafeId, String name, Pageable pageable);

    // Dashboard queries
    Long countByCafeId(Long cafeId);
}
