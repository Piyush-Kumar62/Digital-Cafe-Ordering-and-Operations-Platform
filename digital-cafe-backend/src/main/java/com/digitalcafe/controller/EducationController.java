package com.digitalcafe.controller;

import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.EducationResponse;
import com.digitalcafe.service.EducationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EducationController {

    private final EducationService educationService;

    @GetMapping("/institutions")
    public ResponseEntity<ApiResponse<List<EducationResponse.InstitutionResponse>>> searchInstitutions(
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(
                ApiResponse.success("Institutions retrieved", educationService.searchInstitutions(search))
        );
    }

    @GetMapping("/degrees")
    public ResponseEntity<ApiResponse<List<EducationResponse.DegreeResponse>>> getDegrees(
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(
                ApiResponse.success("Degrees retrieved", educationService.getDegrees(search))
        );
    }

    @GetMapping("/branches")
    public ResponseEntity<ApiResponse<List<EducationResponse.BranchResponse>>> getBranches(
            @RequestParam(value = "degreeId", required = false) Long degreeId,
            @RequestParam(value = "degree", required = false) String degree,
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(
                ApiResponse.success("Branches retrieved", educationService.getBranches(degreeId, degree, search))
        );
    }
}
