package com.digitalcafe.repository;

import com.digitalcafe.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findByDegreeIdOrderByNameAsc(Long degreeId);
    List<Branch> findByDegree_NameIgnoreCaseOrderByNameAsc(String degreeName);
    boolean existsByDegreeIdAndNameIgnoreCase(Long degreeId, String name);
}
