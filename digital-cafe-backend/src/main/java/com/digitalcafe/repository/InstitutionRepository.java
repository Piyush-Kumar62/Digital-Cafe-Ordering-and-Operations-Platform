package com.digitalcafe.repository;

import com.digitalcafe.entity.Institution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstitutionRepository extends JpaRepository<Institution, Long> {
    interface InstitutionKeyRow {
        String getName();
        String getCity();
        String getState();
    }

    List<Institution> findTop200ByNameContainingIgnoreCaseOrCityContainingIgnoreCaseOrStateContainingIgnoreCaseOrderByNameAsc(
            String name, String city, String state
    );

    Optional<Institution> findByNameIgnoreCase(String name);

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
        select i.name as name, i.city as city, i.state as state
        from Institution i
    """)
    List<InstitutionKeyRow> findAllKeys();

    @Query("""
        select i from Institution i
        where (:q is null or :q = ''
               or lower(i.name) like lower(concat('%', :q, '%'))
               or lower(i.city) like lower(concat('%', :q, '%'))
               or lower(i.state) like lower(concat('%', :q, '%')))
        order by i.id asc
    """)
    Page<Institution> search(@Param("q") String query, Pageable pageable);

    @Query(value = """
            select count(*) from (
                select name, city, state
                from institutions
                group by name, city, state
                having count(*) > 1
            ) t
            """, nativeQuery = true)
    long countDuplicateGroups();

    @Query(value = """
            select name, city, state, count(*) cnt
            from institutions
            group by name, city, state
            having count(*) > 1
            limit 10
            """, nativeQuery = true)
    List<Object[]> findDuplicateSamples();
}
