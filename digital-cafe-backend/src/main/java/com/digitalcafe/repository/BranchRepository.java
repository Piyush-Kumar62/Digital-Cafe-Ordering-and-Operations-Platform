package com.digitalcafe.repository;

import com.digitalcafe.entity.Branch;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    interface BranchRow {
        Long getId();
        String getName();
        Long getDegreeId();
        String getDegreeName();
    }

    List<Branch> findByDegreeIdOrderByNameAsc(Long degreeId);
    List<Branch> findByDegree_NameIgnoreCaseOrderByNameAsc(String degreeName);
    List<Branch> findTop50ByDegreeIdAndNameContainingIgnoreCaseOrderByNameAsc(Long degreeId, String name);
    List<Branch> findTop50ByDegree_NameIgnoreCaseAndNameContainingIgnoreCaseOrderByNameAsc(String degreeName, String name);
    List<Branch> findTop50ByNameContainingIgnoreCaseOrderByNameAsc(String name);
    boolean existsByDegreeIdAndNameIgnoreCase(Long degreeId, String name);

    @Query("""
            select b.id as id, b.name as name, d.id as degreeId, d.name as degreeName
            from Branch b join b.degree d
            where d.id = :degreeId
            order by b.name asc
            """)
    List<BranchRow> findRowsByDegreeId(@Param("degreeId") Long degreeId);

    @Query("""
            select b.id as id, b.name as name, d.id as degreeId, d.name as degreeName
            from Branch b join b.degree d
            where lower(d.name) = lower(:degreeName)
            order by b.name asc
            """)
    List<BranchRow> findRowsByDegreeName(@Param("degreeName") String degreeName);

    @Query("""
            select b.id as id, b.name as name, d.id as degreeId, d.name as degreeName
            from Branch b join b.degree d
            where d.id = :degreeId and lower(b.name) like lower(concat('%', :name, '%'))
            order by b.name asc
            """)
    List<BranchRow> findRowsByDegreeIdAndName(@Param("degreeId") Long degreeId, @Param("name") String name);

    @Query("""
            select b.id as id, b.name as name, d.id as degreeId, d.name as degreeName
            from Branch b join b.degree d
            where lower(d.name) = lower(:degreeName)
              and lower(b.name) like lower(concat('%', :name, '%'))
            order by b.name asc
            """)
    List<BranchRow> findRowsByDegreeNameAndName(@Param("degreeName") String degreeName, @Param("name") String name);

    @Query("""
            select b.id as id, b.name as name, d.id as degreeId, d.name as degreeName
            from Branch b join b.degree d
            where lower(b.name) like lower(concat('%', :name, '%'))
            order by b.name asc
            """)
    List<BranchRow> findRowsByName(@Param("name") String name);
}
