package com.digitalcafe.repository;

import com.digitalcafe.entity.EducationImportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EducationImportJobRepository extends JpaRepository<EducationImportJob, Long> {
}
