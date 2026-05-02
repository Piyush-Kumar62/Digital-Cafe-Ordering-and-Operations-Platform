package com.digitalcafe.repository;

import com.digitalcafe.entity.Degree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DegreeRepository extends JpaRepository<Degree, Long> {
    List<Degree> findAllByOrderByNameAsc();
    List<Degree> findTop50ByNameContainingIgnoreCaseOrderByNameAsc(String name);
    Optional<Degree> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);

    @Query("select d.name from Degree d where not exists (select 1 from Branch b where b.degree = d)")
    List<String> findDegreeNamesWithoutBranches();

    @Query(value = """
            select count(*) from (
                select name
                from degrees
                group by name
                having count(*) > 1
            ) t
            """, nativeQuery = true)
    long countDuplicateGroups();

    @Query(value = """
            select name, count(*) cnt
            from degrees
            group by name
            having count(*) > 1
            limit 10
            """, nativeQuery = true)
    List<Object[]> findDuplicateSamples();
}
