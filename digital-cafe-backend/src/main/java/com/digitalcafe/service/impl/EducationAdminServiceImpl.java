package com.digitalcafe.service.impl;

import com.digitalcafe.dto.response.EducationImportJobResponse;
import com.digitalcafe.dto.response.EducationHealthResponse;
import com.digitalcafe.dto.response.EducationResponse;
import com.digitalcafe.dto.response.EducationDuplicateReportResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.EducationImportJob;
import com.digitalcafe.entity.Institution;
import com.digitalcafe.repository.BranchRepository;
import com.digitalcafe.repository.DegreeRepository;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.repository.EducationImportJobRepository;
import com.digitalcafe.repository.InstitutionRepository;
import com.digitalcafe.service.EducationAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.Files;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EducationAdminServiceImpl implements EducationAdminService {

    private final InstitutionRepository institutionRepository;
    private final DegreeRepository degreeRepository;
    private final BranchRepository branchRepository;
    private final EducationImportJobRepository jobRepository;
    private final EducationImportWorker importWorker;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.education.import.degrees.enabled:false}")
    private boolean degreeImportEnabled;

    @Value("${app.education.import.branches.enabled:false}")
    private boolean branchImportEnabled;

    @Value("${app.education.import.sync:true}")
    private boolean importSyncEnabled;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EducationResponse.InstitutionResponse> getInstitutions(
            String query,
            Pageable pageable
    ) {
        Page<Institution> page = institutionRepository.search(query, pageable);
        List<EducationResponse.InstitutionResponse> content = page.getContent().stream()
                .map(inst -> EducationResponse.InstitutionResponse.builder()
                        .id(inst.getId())
                        .name(inst.getName())
                        .city(inst.getCity())
                        .state(inst.getState())
                        .build())
                .collect(Collectors.toList());

        return PageResponse.<EducationResponse.InstitutionResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .hasNext(!page.isLast())
                .hasPrevious(!page.isFirst())
                .build();
    }

    @Override
    @Transactional
    public EducationImportJobResponse startInstitutionImport(MultipartFile file) {
        return startImport(file, EducationImportJob.ImportType.INSTITUTIONS);
    }

    @Override
    @Transactional
    public EducationImportJobResponse startDegreeImport(MultipartFile file) {
        if (!degreeImportEnabled) {
            throw new BadRequestException("Degree import is disabled");
        }
        return startImport(file, EducationImportJob.ImportType.DEGREES);
    }

    @Override
    @Transactional
    public EducationImportJobResponse startBranchImport(MultipartFile file) {
        if (!branchImportEnabled) {
            throw new BadRequestException("Branch import is disabled");
        }
        return startImport(file, EducationImportJob.ImportType.BRANCHES);
    }

    @Override
    @Transactional(readOnly = true)
    public EducationImportJobResponse getImportJob(Long id) {
        EducationImportJob job = jobRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Import job not found"));
        return toJobResponse(job);
    }

    @Override
    @Transactional(readOnly = true)
    public EducationImportJobResponse getLatestImportJob(EducationImportJob.ImportType type) {
        EducationImportJob.ImportType resolvedType =
                type == null ? EducationImportJob.ImportType.INSTITUTIONS : type;
        EducationImportJob job = jobRepository
                .findTopByImportTypeOrderByIdDesc(resolvedType)
                .orElseThrow(() -> new BadRequestException("Import job not found"));
        return toJobResponse(job);
    }

    @Override
    @Transactional(readOnly = true)
    public EducationHealthResponse getEducationHealth() {
        List<String> missingBranchDegrees = degreeRepository.findDegreeNamesWithoutBranches();
        return EducationHealthResponse.builder()
                .institutionCount(institutionRepository.count())
                .degreeCount(degreeRepository.count())
                .branchCount(branchRepository.count())
                .degreesMissingBranches(missingBranchDegrees.size())
                .degreeNamesMissingBranches(missingBranchDegrees)
                .build();
    }

    @Override
    @Transactional
    public EducationImportJobResponse startLocalImport(String filename, EducationImportJob.ImportType type) {
        if (!isImportEnabled(type)) {
            throw new BadRequestException(type + " import is disabled");
        }
        if (filename == null || filename.isBlank()) {
            throw new BadRequestException("Filename is required");
        }
        Path base = Path.of(uploadDir).toAbsolutePath().normalize();
        Path requested = base.resolve(filename).normalize();
        if (!requested.startsWith(base)) {
            throw new BadRequestException("Invalid filename");
        }
        if (!Files.exists(requested)) {
            throw new BadRequestException("File not found in uploads");
        }

        EducationImportJob job = EducationImportJob.builder()
                .importType(type)
                .status(EducationImportJob.Status.PENDING)
                .fileName(requested.getFileName().toString())
                .build();
        job = jobRepository.save(job);

        try {
            Path temp = Files.createTempFile("education-local-import-", ".csv");
            Files.copy(requested, temp, StandardCopyOption.REPLACE_EXISTING);
            if (importSyncEnabled) {
                importWorker.processImportSync(job.getId(), temp, type);
            } else {
                importWorker.processImport(job.getId(), temp, type);
            }
        } catch (Exception ex) {
            job.setStatus(EducationImportJob.Status.FAILED);
            job.setErrorMessage("Unable to queue local import: " + ex.getMessage());
            jobRepository.save(job);
        }

        if (importSyncEnabled) {
            job = jobRepository.findById(job.getId()).orElse(job);
        }
        return toJobResponse(job);
    }

    @Override
    @Transactional(readOnly = true)
    public EducationDuplicateReportResponse getDuplicateReport() {
        long institutionGroups = institutionRepository.countDuplicateGroups();
        long degreeGroups = degreeRepository.countDuplicateGroups();
        long branchGroups = branchRepository.countDuplicateGroups();

        List<EducationDuplicateReportResponse.DuplicateEntry> institutionSamples =
                fetchDuplicateSamples(
                        institutionRepository.findDuplicateSamples(),
                        row -> String.format("%s (%s, %s)",
                                row[0], row[1] == null ? "NA" : row[1], row[2] == null ? "NA" : row[2])
                );
        List<EducationDuplicateReportResponse.DuplicateEntry> degreeSamples =
                fetchDuplicateSamples(
                        degreeRepository.findDuplicateSamples(),
                        row -> String.valueOf(row[0])
                );
        List<EducationDuplicateReportResponse.DuplicateEntry> branchSamples =
                fetchDuplicateSamples(
                        branchRepository.findDuplicateSamples(),
                        row -> String.format("degreeId=%s | %s", row[0], row[1])
                );

        return EducationDuplicateReportResponse.builder()
                .institutionDuplicateGroups(institutionGroups)
                .degreeDuplicateGroups(degreeGroups)
                .branchDuplicateGroups(branchGroups)
                .institutionSamples(institutionSamples)
                .degreeSamples(degreeSamples)
                .branchSamples(branchSamples)
                .build();
    }

    private List<EducationDuplicateReportResponse.DuplicateEntry> fetchDuplicateSamples(
            List<Object[]> rows,
            java.util.function.Function<Object[], String> labelMapper
    ) {
        List<EducationDuplicateReportResponse.DuplicateEntry> result = new java.util.ArrayList<>();
        for (Object[] row : rows) {
            String label = labelMapper.apply(row);
            long count = 0;
            Object countObj = row[row.length - 1];
            if (countObj instanceof Number number) {
                count = number.longValue();
            }
            result.add(EducationDuplicateReportResponse.DuplicateEntry.builder()
                    .label(label)
                    .count(count)
                    .build());
        }
        return result;
    }

    private EducationImportJobResponse startImport(MultipartFile file, EducationImportJob.ImportType type) {
        if (!isImportEnabled(type)) {
            throw new BadRequestException(type + " import is disabled");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is required");
        }

        EducationImportJob job = EducationImportJob.builder()
                .importType(type)
                .status(EducationImportJob.Status.PENDING)
                .fileName(file.getOriginalFilename())
                .build();
        job = jobRepository.save(job);

        try {
            java.nio.file.Path temp = Files.createTempFile("education-import-", ".csv");
            Files.copy(file.getInputStream(), temp, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            if (importSyncEnabled) {
                importWorker.processImportSync(job.getId(), temp, type);
            } else {
                importWorker.processImport(job.getId(), temp, type);
            }
        } catch (Exception ex) {
            log.error("Unable to queue import job {}", job.getId(), ex);
            job.setStatus(EducationImportJob.Status.FAILED);
            job.setErrorMessage("Unable to queue import: " + ex.getMessage());
            jobRepository.save(job);
        }

        if (importSyncEnabled) {
            job = jobRepository.findById(job.getId()).orElse(job);
        }
        return toJobResponse(job);
    }

    private boolean isImportEnabled(EducationImportJob.ImportType type) {
        return switch (type) {
            case INSTITUTIONS -> true;
            case DEGREES -> degreeImportEnabled;
            case BRANCHES -> branchImportEnabled;
        };
    }

    private EducationImportJobResponse toJobResponse(EducationImportJob job) {
        List<String> errors = job.getErrorDetails() == null || job.getErrorDetails().isBlank()
                ? List.of()
                : List.of(job.getErrorDetails().split("\n"));
        return EducationImportJobResponse.builder()
                .id(job.getId())
                .importType(job.getImportType().name())
                .status(job.getStatus().name())
                .fileName(job.getFileName())
                .totalRows(job.getTotalRows())
                .insertedRows(job.getInsertedRows())
                .skippedRows(job.getSkippedRows())
                .errorMessage(job.getErrorMessage())
                .errors(errors)
                .startedAt(job.getStartedAt())
                .finishedAt(job.getFinishedAt())
                .build();
    }
}
