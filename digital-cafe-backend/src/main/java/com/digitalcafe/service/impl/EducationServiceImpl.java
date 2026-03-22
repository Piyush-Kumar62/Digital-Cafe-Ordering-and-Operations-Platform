package com.digitalcafe.service.impl;

import com.digitalcafe.dto.response.EducationResponse;
import com.digitalcafe.entity.Branch;
import com.digitalcafe.entity.Degree;
import com.digitalcafe.entity.Institution;
import com.digitalcafe.repository.BranchRepository;
import com.digitalcafe.repository.DegreeRepository;
import com.digitalcafe.repository.InstitutionRepository;
import com.digitalcafe.service.EducationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EducationServiceImpl implements EducationService {

    private final InstitutionRepository institutionRepository;
    private final DegreeRepository degreeRepository;
    private final BranchRepository branchRepository;

    @Override
    public List<EducationResponse.InstitutionResponse> searchInstitutions(String query) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 2) {
            return Collections.emptyList();
        }
        List<Institution> results =
                institutionRepository
                        .findTop20ByNameContainingIgnoreCaseOrCityContainingIgnoreCaseOrStateContainingIgnoreCaseOrderByNameAsc(
                                q, q, q);
        return results.stream()
                .map(inst -> EducationResponse.InstitutionResponse.builder()
                        .id(inst.getId())
                        .name(inst.getName())
                        .city(inst.getCity())
                        .state(inst.getState())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<EducationResponse.DegreeResponse> getDegrees() {
        return degreeRepository.findAllByOrderByNameAsc()
                .stream()
                .map(degree -> EducationResponse.DegreeResponse.builder()
                        .id(degree.getId())
                        .name(degree.getName())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<EducationResponse.BranchResponse> getBranches(Long degreeId, String degree) {
        List<Branch> branches;
        if (degreeId != null) {
            branches = branchRepository.findByDegreeIdOrderByNameAsc(degreeId);
        } else if (degree != null && !degree.trim().isEmpty()) {
            branches = branchRepository.findByDegree_NameIgnoreCaseOrderByNameAsc(degree.trim());
        } else {
            return Collections.emptyList();
        }

        return branches.stream()
                .map(branch -> EducationResponse.BranchResponse.builder()
                        .id(branch.getId())
                        .name(branch.getName())
                        .degreeId(branch.getDegree() != null ? branch.getDegree().getId() : null)
                        .degreeName(branch.getDegree() != null ? branch.getDegree().getName() : null)
                        .build())
                .collect(Collectors.toList());
    }
}
