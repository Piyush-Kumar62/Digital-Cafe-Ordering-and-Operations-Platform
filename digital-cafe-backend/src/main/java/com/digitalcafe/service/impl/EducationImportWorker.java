package com.digitalcafe.service.impl;

import com.digitalcafe.entity.Branch;
import com.digitalcafe.entity.Degree;
import com.digitalcafe.entity.EducationImportJob;
import com.digitalcafe.entity.Institution;
import com.digitalcafe.repository.BranchRepository;
import com.digitalcafe.repository.DegreeRepository;
import com.digitalcafe.repository.EducationImportJobRepository;
import com.digitalcafe.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EducationImportWorker {

    private static final int ERROR_LIMIT = 20;

    private final EducationImportJobRepository jobRepository;
    private final InstitutionRepository institutionRepository;
    private final DegreeRepository degreeRepository;
    private final BranchRepository branchRepository;

    @Async("educationImportTaskExecutor")
    @Transactional
    public void processImport(Long jobId, Path filePath, EducationImportJob.ImportType type) {
        processImportInternal(jobId, filePath, type);
    }

    @Transactional
    public void processImportSync(Long jobId, Path filePath, EducationImportJob.ImportType type) {
        processImportInternal(jobId, filePath, type);
    }

    private void processImportInternal(Long jobId, Path filePath, EducationImportJob.ImportType type) {
        EducationImportJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        job.setStatus(EducationImportJob.Status.RUNNING);
        job.setStartedAt(LocalDateTime.now());
        jobRepository.save(job);

        int inserted = 0;
        int skipped = 0;
        int total = 0;
        List<String> errors = new ArrayList<>();

        int nameIndex = 0;
        int cityIndex = 1;
        int stateIndex = 2;
        int degreeIndex = 0;
        int branchIndex = 1;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(Files.newInputStream(filePath), StandardCharsets.UTF_8))) {
            String line;
            boolean headerChecked = false;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;
                if (!headerChecked) {
                    headerChecked = true;
                    if (looksLikeHeader(trimmed, type)) {
                        List<String> headerCols = parseCsvLine(trimmed);
                        if (type == EducationImportJob.ImportType.INSTITUTIONS) {
                            nameIndex = findIndex(headerCols, "college name", "institution name", "higher educational institutions (heis)", "higher educational institutions", "hei name", "name");
                            if (nameIndex < 0) nameIndex = 0;
                            cityIndex = findIndex(headerCols, "district name", "district", "city", "town", "location");
                            if (cityIndex < 0) cityIndex = 1;
                            stateIndex = findIndex(headerCols, "state name", "state/ut", "state ut", "state");
                            if (stateIndex < 0) stateIndex = 2;
                        } else if (type == EducationImportJob.ImportType.DEGREES) {
                            degreeIndex = findIndex(headerCols, "degree", "degree name", "name");
                            if (degreeIndex < 0) degreeIndex = 0;
                        } else if (type == EducationImportJob.ImportType.BRANCHES) {
                            degreeIndex = findIndex(headerCols, "degree", "degree name");
                            if (degreeIndex < 0) degreeIndex = 0;
                            branchIndex = findIndex(headerCols, "branch", "branch name", "stream");
                            if (branchIndex < 0) branchIndex = 1;
                        }
                        continue;
                    }
                }
                total++;
                List<String> cols = parseCsvLine(trimmed);
                switch (type) {
                    case INSTITUTIONS -> {
                        String name = normalizeName(safe(cols, nameIndex));
                        String city = normalizeName(safe(cols, cityIndex));
                        String state = normalizeName(safe(cols, stateIndex));
                        if (name.isEmpty()) {
                            skipped++;
                            addError(errors, "Missing institution name at row " + total);
                            continue;
                        }
                        String finalCity = city.isEmpty() ? null : city;
                        String finalState = state.isEmpty() ? null : state;
                        if (institutionRepository.existsByNameCityStateIgnoreCase(
                                name, finalCity, finalState)) {
                            skipped++;
                            continue;
                        }
                        institutionRepository.save(Institution.builder()
                                .name(name)
                                .city(finalCity)
                                .state(finalState)
                                .build());
                        inserted++;
                    }
                    case DEGREES -> {
                        String name = normalizeName(safe(cols, degreeIndex));
                        if (name.isEmpty()) {
                            skipped++;
                            addError(errors, "Missing degree name at row " + total);
                            continue;
                        }
                        if (degreeRepository.existsByNameIgnoreCase(name)) {
                            skipped++;
                            continue;
                        }
                        degreeRepository.save(Degree.builder().name(name).build());
                        inserted++;
                    }
                    case BRANCHES -> {
                        String degreeName = normalizeName(safe(cols, degreeIndex));
                        String branchName = normalizeName(safe(cols, branchIndex));
                        if (degreeName.isEmpty() || branchName.isEmpty()) {
                            skipped++;
                            addError(errors, "Missing degree/branch at row " + total);
                            continue;
                        }
                        Degree degree = degreeRepository.findByNameIgnoreCase(degreeName)
                                .orElseGet(() -> degreeRepository.save(Degree.builder().name(degreeName).build()));
                        if (branchRepository.existsByDegreeIdAndNameIgnoreCase(degree.getId(), branchName)) {
                            skipped++;
                            continue;
                        }
                        branchRepository.save(Branch.builder()
                                .name(branchName)
                                .degree(degree)
                                .build());
                        inserted++;
                    }
                }
            }

            job.setStatus(EducationImportJob.Status.COMPLETED);
            job.setTotalRows(total);
            job.setInsertedRows(inserted);
            job.setSkippedRows(skipped);
            job.setErrorDetails(String.join("\n", errors));
            job.setFinishedAt(LocalDateTime.now());
            jobRepository.save(job);
        } catch (Exception ex) {
            log.error("Education import failed for job {}", jobId, ex);
            job.setStatus(EducationImportJob.Status.FAILED);
            job.setErrorMessage(ex.getMessage());
            job.setErrorDetails(String.join("\n", errors));
            job.setFinishedAt(LocalDateTime.now());
            jobRepository.save(job);
        } finally {
            try {
                Files.deleteIfExists(filePath);
            } catch (Exception ex) {
                log.warn("Failed to delete temp import file {}", filePath, ex);
            }
        }
    }

    private static boolean looksLikeHeader(String line, EducationImportJob.ImportType type) {
        String lower = line.toLowerCase();
        return switch (type) {
            case INSTITUTIONS -> (lower.contains("college") || lower.contains("institution") || lower.contains("name"))
                    && (lower.contains("city") || lower.contains("state") || lower.contains("district"));
            case DEGREES -> lower.contains("degree");
            case BRANCHES -> lower.contains("degree") && lower.contains("branch");
        };
    }

    private static String safe(List<String> cols, int index) {
        if (cols == null || cols.size() <= index) return "";
        return cols.get(index) == null ? "" : cols.get(index).trim();
    }

    private static void addError(List<String> errors, String message) {
        if (errors.size() < ERROR_LIMIT) {
            errors.add(message);
        }
    }

    private static int findIndex(List<String> cols, String... candidates) {
        if (cols == null || cols.isEmpty()) return -1;
        for (int i = 0; i < cols.size(); i++) {
            String normalized = normalizeHeader(cols.get(i));
            for (String candidate : candidates) {
                if (normalized.equals(normalizeHeader(candidate))) {
                    return i;
                }
            }
        }
        return -1;
    }

    private static String normalizeHeader(String value) {
        if (value == null) return "";
        return value
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    private static String normalizeName(String value) {
        if (value == null) return "";
        return value.replaceAll("\\s+", " ").trim();
    }

    private static List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                result.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        result.add(current.toString());
        return result;
    }
}
