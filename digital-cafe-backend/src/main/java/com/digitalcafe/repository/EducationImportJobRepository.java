package com.digitalcafe.repository;

import com.digitalcafe.entity.EducationImportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EducationImportJobRepository extends JpaRepository<EducationImportJob, Long> {
    Optional<EducationImportJob> findTopByImportTypeOrderByIdDesc(EducationImportJob.ImportType importType);
}
