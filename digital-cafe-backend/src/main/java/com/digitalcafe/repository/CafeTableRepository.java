package com.digitalcafe.repository;

import com.digitalcafe.model.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {
    List<CafeTable> findByCafeId(Long cafeId);
    List<CafeTable> findByCafeIdAndStatus(Long cafeId, CafeTable.TableStatus status);
    List<CafeTable> findByActive(Boolean active);
}
