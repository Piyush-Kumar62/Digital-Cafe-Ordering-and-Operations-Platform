package com.digitalcafe.repository;

import com.digitalcafe.entity.CafeTable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {
    List<CafeTable> findByCafeId(Long cafeId);
    Page<CafeTable> findByCafeId(Long cafeId, Pageable pageable);
    List<CafeTable> findByCafeIdAndIsAvailable(Long cafeId, Boolean isAvailable);
    Page<CafeTable> findByCafeIdAndIsAvailable(Long cafeId, Boolean isAvailable, Pageable pageable);
    List<CafeTable> findByIsAvailable(Boolean isAvailable);
    List<CafeTable> findByCafeIdAndCapacityGreaterThanEqual(Long cafeId, Integer capacity);
    Page<CafeTable> findByCafeIdAndCapacityGreaterThanEqual(Long cafeId, Integer capacity, Pageable pageable);
    boolean existsByCafeIdAndTableNumber(Long cafeId, String tableNumber);

    // Dashboard queries
    Long countByCafeId(Long cafeId);
}
