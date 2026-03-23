package com.digitalcafe.controller;

import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.EducationHealthResponse;
import com.digitalcafe.dto.response.EducationDuplicateReportResponse;
import com.digitalcafe.dto.response.EducationImportJobResponse;
import com.digitalcafe.dto.response.EducationResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.EducationImportJob;
import com.digitalcafe.service.EducationAdminService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/education")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminEducationController {

    private final EducationAdminService educationAdminService;

    @GetMapping("/institutions")
    public ResponseEntity<ApiResponse<PageResponse<EducationResponse.InstitutionResponse>>> getInstitutions(
            @RequestParam(value = "search", required = false) String search,
            Pageable pageable) {
        var response = educationAdminService.getInstitutions(search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Institutions retrieved", response));
    }

    @PostMapping(value = "/institutions/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EducationImportJobResponse>> importInstitutions(
            @NotNull @RequestPart("file") MultipartFile file) {
        var result = educationAdminService.startInstitutionImport(file);
        return ResponseEntity.ok(ApiResponse.success("Institution import queued", result));
    }

    @PostMapping(value = "/degrees/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EducationImportJobResponse>> importDegrees(
            @NotNull @RequestPart("file") MultipartFile file) {
        var result = educationAdminService.startDegreeImport(file);
        return ResponseEntity.ok(ApiResponse.success("Degree import queued", result));
    }

    @PostMapping(value = "/branches/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EducationImportJobResponse>> importBranches(
            @NotNull @RequestPart("file") MultipartFile file) {
        var result = educationAdminService.startBranchImport(file);
        return ResponseEntity.ok(ApiResponse.success("Branch import queued", result));
    }

    @GetMapping("/imports/{id}")
    public ResponseEntity<ApiResponse<EducationImportJobResponse>> getImportJob(@PathVariable Long id) {
        var result = educationAdminService.getImportJob(id);
        return ResponseEntity.ok(ApiResponse.success("Import status retrieved", result));
    }

    @GetMapping("/imports/latest")
    public ResponseEntity<ApiResponse<EducationImportJobResponse>> getLatestImportJob(
            @RequestParam(value = "type", defaultValue = "INSTITUTIONS") String type) {
        EducationImportJob.ImportType importType = EducationImportJob.ImportType.valueOf(type.toUpperCase());
        var result = educationAdminService.getLatestImportJob(importType);
        return ResponseEntity.ok(ApiResponse.success("Latest import status retrieved", result));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<EducationHealthResponse>> getEducationHealth() {
        var result = educationAdminService.getEducationHealth();
        return ResponseEntity.ok(ApiResponse.success("Education health retrieved", result));
    }

    @PostMapping("/imports/local")
    public ResponseEntity<ApiResponse<EducationImportJobResponse>> importLocalFile(
            @RequestParam("filename") String filename,
            @RequestParam(value = "type", defaultValue = "INSTITUTIONS") String type) {
        EducationImportJob.ImportType importType = EducationImportJob.ImportType.valueOf(type.toUpperCase());
        var result = educationAdminService.startLocalImport(filename, importType);
        return ResponseEntity.ok(ApiResponse.success("Local import queued", result));
    }

    @GetMapping("/duplicates")
    public ResponseEntity<ApiResponse<EducationDuplicateReportResponse>> getDuplicateReport() {
        var result = educationAdminService.getDuplicateReport();
        return ResponseEntity.ok(ApiResponse.success("Duplicate report retrieved", result));
    }
}
