package com.digitalcafe.repository;

import com.digitalcafe.entity.Institution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, Long> {
    List<Institution> findTop20ByNameContainingIgnoreCaseOrCityContainingIgnoreCaseOrStateContainingIgnoreCaseOrderByNameAsc(
            String name, String city, String state
    );

    @Query("""
        select count(i) > 0 from Institution i
        where lower(i.name) = lower(:name)
          and ((:city is null and i.city is null) or lower(i.city) = lower(:city))
          and ((:state is null and i.state is null) or lower(i.state) = lower(:state))
    """)
    boolean existsByNameCityStateIgnoreCase(
            @Param("name") String name,
            @Param("city") String city,
            @Param("state") String state
    );

    @Query("""
        select i from Institution i
        where (:q is null or :q = ''
               or lower(i.name) like lower(concat('%', :q, '%'))
               or lower(i.city) like lower(concat('%', :q, '%'))
               or lower(i.state) like lower(concat('%', :q, '%')))
    """)
    Page<Institution> search(@Param("q") String query, Pageable pageable);
}
