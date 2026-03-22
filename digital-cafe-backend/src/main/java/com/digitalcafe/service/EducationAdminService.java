package com.digitalcafe.service;

import com.digitalcafe.dto.response.EducationImportJobResponse;
import com.digitalcafe.dto.response.EducationHealthResponse;
import com.digitalcafe.dto.response.EducationResponse;
import com.digitalcafe.dto.response.EducationSyncResponse;
import com.digitalcafe.dto.response.EducationDuplicateReportResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.EducationImportJob;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface EducationAdminService {
    PageResponse<EducationResponse.InstitutionResponse> getInstitutions(String query, Pageable pageable);
    EducationImportJobResponse startInstitutionImport(MultipartFile file);
    EducationImportJobResponse startDegreeImport(MultipartFile file);
    EducationImportJobResponse startBranchImport(MultipartFile file);
    EducationImportJobResponse getImportJob(Long id);
    EducationHealthResponse getEducationHealth();
    EducationSyncResponse syncInstitutionsFromDataGov();
    EducationImportJobResponse startLocalImport(String filename, EducationImportJob.ImportType type);
    EducationDuplicateReportResponse getDuplicateReport();
}
