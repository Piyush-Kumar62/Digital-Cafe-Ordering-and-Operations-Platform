package com.digitalcafe.config;

import com.digitalcafe.entity.EducationImportJob;
import com.digitalcafe.repository.EducationImportJobRepository;
import com.digitalcafe.repository.InstitutionRepository;
import com.digitalcafe.service.impl.EducationImportWorker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.education.auto-import.enabled", havingValue = "true")
public class EducationAutoImportRunner {

    private final InstitutionRepository institutionRepository;
    private final EducationImportJobRepository jobRepository;
    private final EducationImportWorker importWorker;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.education.auto-import.filename:list_all_colleges_2011_2012.csv}")
    private String autoImportFilename;

    @Value("${app.education.auto-import.min-count:100}")
    private long minCount;

    @Bean
    @Order(3)
    public ApplicationRunner autoImportInstitutions() {
        return args -> {
            long currentCount = institutionRepository.count();
            if (currentCount >= minCount) {
                log.info("[EducationAutoImport] Skipping auto import. Current institutions count: {}", currentCount);
                return;
            }

            Path base = Path.of(uploadDir).toAbsolutePath().normalize();
            Path source = base.resolve(autoImportFilename).normalize();
            if (!source.startsWith(base) || !Files.exists(source)) {
                log.warn("[EducationAutoImport] File not found: {}", source);
                return;
            }

            EducationImportJob job = EducationImportJob.builder()
                    .importType(EducationImportJob.ImportType.INSTITUTIONS)
                    .status(EducationImportJob.Status.PENDING)
                    .fileName(source.getFileName().toString())
                    .build();
            job = jobRepository.save(job);

            try {
                Path temp = Files.createTempFile("education-auto-import-", ".csv");
                Files.copy(source, temp, StandardCopyOption.REPLACE_EXISTING);
                log.info("[EducationAutoImport] Starting auto import jobId={} from {}", job.getId(), source);
                importWorker.processImport(job.getId(), temp, EducationImportJob.ImportType.INSTITUTIONS);
            } catch (Exception ex) {
                log.error("[EducationAutoImport] Failed to start auto import: {}", ex.getMessage());
                job.setStatus(EducationImportJob.Status.FAILED);
                job.setErrorMessage("Auto import failed: " + ex.getMessage());
                jobRepository.save(job);
            }
        };
    }
}
