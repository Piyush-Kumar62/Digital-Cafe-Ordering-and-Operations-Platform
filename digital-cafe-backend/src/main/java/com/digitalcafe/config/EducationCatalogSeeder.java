package com.digitalcafe.config;

import com.digitalcafe.entity.Branch;
import com.digitalcafe.entity.Degree;
import com.digitalcafe.repository.BranchRepository;
import com.digitalcafe.repository.DegreeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.education.seed.enabled", havingValue = "true", matchIfMissing = true)
public class EducationCatalogSeeder {

    private static final String DEGREES_RESOURCE = "classpath:education/degrees.csv";
    private static final String BRANCHES_RESOURCE = "classpath:education/branches.csv";

    private final DegreeRepository degreeRepository;
    private final BranchRepository branchRepository;
    private final ResourceLoader resourceLoader;

    @Bean
    @Order(2)
    public CommandLineRunner seedEducationCatalog() {
        return args -> {
            seedDegreesIfEmpty();
            seedBranchesIfEmpty();
        };
    }

    private void seedDegreesIfEmpty() {
        if (degreeRepository.count() > 0) {
            log.info("[EducationSeed] Degrees already present ({}). Skipping seed.", degreeRepository.count());
            return;
        }
        List<List<String>> rows = readCsv(DEGREES_RESOURCE);
        Set<String> seen = new HashSet<>();
        int inserted = 0;
        for (List<String> row : rows) {
            if (row.isEmpty()) continue;
            String name = normalizeName(row.get(0));
            if (name.isBlank()) continue;
            String key = name.toLowerCase();
            if (seen.contains(key)) continue;
            if (degreeRepository.existsByNameIgnoreCase(name)) continue;
            degreeRepository.save(Degree.builder().name(name).build());
            seen.add(key);
            inserted++;
        }
        log.info("[EducationSeed] Seeded {} degrees.", inserted);
    }

    private void seedBranchesIfEmpty() {
        long existing = branchRepository.count();
        if (existing > 0) {
            log.info("[EducationSeed] Branches already present ({}). Seeding missing rows only.", existing);
        }
        List<List<String>> rows = readCsv(BRANCHES_RESOURCE);
        Set<String> seen = new HashSet<>();
        int inserted = 0;
        for (List<String> row : rows) {
            if (row.size() < 2) continue;
            String degreeName = normalizeName(row.get(0));
            String branchName = normalizeName(row.get(1));
            if (degreeName.isBlank() || branchName.isBlank()) continue;
            String key = degreeName.toLowerCase() + "|" + branchName.toLowerCase();
            if (seen.contains(key)) continue;

            Degree degree = degreeRepository.findByNameIgnoreCase(degreeName)
                    .orElseGet(() -> degreeRepository.save(Degree.builder().name(degreeName).build()));

            if (branchRepository.existsByDegreeIdAndNameIgnoreCase(degree.getId(), branchName)) {
                continue;
            }

            branchRepository.save(Branch.builder()
                    .name(branchName)
                    .degree(degree)
                    .build());
            seen.add(key);
            inserted++;
        }
        log.info("[EducationSeed] Seeded {} branches.", inserted);
    }

    private List<List<String>> readCsv(String resourcePath) {
        List<List<String>> rows = new ArrayList<>();
        try {
            Resource resource = resourceLoader.getResource(resourcePath);
            if (!resource.exists()) {
                log.warn("[EducationSeed] Resource not found: {}", resourcePath);
                return rows;
            }
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                boolean headerChecked = false;
                while ((line = reader.readLine()) != null) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty()) continue;
                    if (!headerChecked) {
                        headerChecked = true;
                        if (looksLikeHeader(trimmed)) {
                            continue;
                        }
                    }
                    rows.add(parseCsvLine(trimmed));
                }
            }
        } catch (Exception ex) {
            log.warn("[EducationSeed] Failed reading {}: {}", resourcePath, ex.getMessage());
        }
        return rows;
    }

    private static boolean looksLikeHeader(String line) {
        String lower = line.toLowerCase();
        return lower.contains("degree") || lower.contains("branch");
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
