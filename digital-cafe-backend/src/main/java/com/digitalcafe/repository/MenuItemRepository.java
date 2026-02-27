package com.digitalcafe.repository;

import com.digitalcafe.entity.MenuItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCafeIdAndIsDeletedFalse(Long cafeId);
    Page<MenuItem> findByCafeIdAndIsDeletedFalse(Long cafeId, Pageable pageable);

    List<MenuItem> findByCafeIdAndIsAvailableTrueAndIsDeletedFalse(Long cafeId);
    Page<MenuItem> findByCafeIdAndIsAvailableTrueAndIsDeletedFalse(Long cafeId, Pageable pageable);

    List<MenuItem> findByCafeIdAndCategoryAndIsAvailableTrueAndIsDeletedFalse(Long cafeId, MenuItem.Category category);
    Page<MenuItem> findByCafeIdAndCategoryAndIsDeletedFalse(Long cafeId, MenuItem.Category category, Pageable pageable);

    List<MenuItem> findByCafeIdAndIsVegetarianTrueAndIsDeletedFalse(Long cafeId);
    Page<MenuItem> findByCafeIdAndIsVegetarianTrueAndIsDeletedFalse(Long cafeId, Pageable pageable);

    Page<MenuItem> findByCafeIdAndIsVeganTrueAndIsDeletedFalse(Long cafeId, Pageable pageable);

    Page<MenuItem> findByCafeIdAndNameContainingIgnoreCaseAndIsDeletedFalse(Long cafeId, String name, Pageable pageable);
    List<MenuItem> findByCafeIdAndIsAvailableTrueAndIsDeletedFalseOrderByCategoryAscNameAsc(Long cafeId);

    // Dashboard queries
    Long countByCafeIdAndIsDeletedFalse(Long cafeId);
}
