package com.digitalcafe.repository;

import com.digitalcafe.entity.CafeTable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM CafeTable t WHERE t.id = :tableId")
    Optional<CafeTable> findByIdForUpdate(@Param("tableId") Long tableId);

    // Dashboard queries
    Long countByCafeId(Long cafeId);
    Long countByCafeIdAndIsAvailable(Long cafeId, Boolean isAvailable);
}
