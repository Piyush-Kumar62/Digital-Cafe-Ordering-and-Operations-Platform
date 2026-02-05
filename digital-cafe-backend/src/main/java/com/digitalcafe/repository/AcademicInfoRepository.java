package com.digitalcafe.repository;

import com.digitalcafe.model.AcademicInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicInfoRepository extends JpaRepository<AcademicInfo, Long> {
    List<AcademicInfo> findByProfileId(Long profileId);
}
