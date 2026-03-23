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
        String q = query == null ? "" : query.trim().replaceAll("\\s+", " ");
        if (q.length() < 2) {
            return Collections.emptyList();
        }
        List<Institution> results =
                institutionRepository
                        .findTop200ByNameContainingIgnoreCaseOrCityContainingIgnoreCaseOrStateContainingIgnoreCaseOrderByNameAsc(
                                q, q, q);
        institutionRepository.findByNameIgnoreCase(q).ifPresent(exact -> {
            boolean exists = results.stream().anyMatch(i -> i.getId().equals(exact.getId()));
            if (!exists) {
                results.add(0, exact);
            }
        });
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
    public List<EducationResponse.DegreeResponse> getDegrees(String search) {
        String q = search == null ? "" : search.trim();
        List<Degree> degrees = q.isEmpty()
                ? degreeRepository.findAllByOrderByNameAsc()
                : degreeRepository.findTop50ByNameContainingIgnoreCaseOrderByNameAsc(q);
        return degrees
                .stream()
                .map(degree -> EducationResponse.DegreeResponse.builder()
                        .id(degree.getId())
                        .name(degree.getName())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<EducationResponse.BranchResponse> getBranches(Long degreeId, String degree, String search) {
        String q = search == null ? "" : search.trim();
        List<BranchRepository.BranchRow> branches;
        if (degreeId != null) {
            branches = q.isEmpty()
                    ? branchRepository.findRowsByDegreeId(degreeId)
                    : branchRepository.findRowsByDegreeIdAndName(degreeId, q);
        } else if (degree != null && !degree.trim().isEmpty()) {
            String degreeName = degree.trim();
            branches = q.isEmpty()
                    ? branchRepository.findRowsByDegreeName(degreeName)
                    : branchRepository.findRowsByDegreeNameAndName(degreeName, q);
        } else if (!q.isEmpty() && q.length() >= 2) {
            branches = branchRepository.findRowsByName(q);
        } else {
            return Collections.emptyList();
        }

        return branches.stream()
                .map(branch -> EducationResponse.BranchResponse.builder()
                        .id(branch.getId())
                        .name(branch.getName())
                        .degreeId(branch.getDegreeId())
                        .degreeName(branch.getDegreeName())
                        .build())
                .collect(Collectors.toList());
    }
}
