package com.digitalcafe.service;

import com.digitalcafe.dto.response.EducationResponse;

import java.util.List;

public interface EducationService {
    List<EducationResponse.InstitutionResponse> searchInstitutions(String query);
    List<EducationResponse.DegreeResponse> getDegrees();
    List<EducationResponse.BranchResponse> getBranches(Long degreeId, String degree);
}
