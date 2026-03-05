package com.digitalcafe.storage;

import com.digitalcafe.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Default local-disk implementation of FileStorageService.
 *
 * In deployment, this should be swapped with an S3-backed implementation.
 * The upload.dir property is set to an EFS or persistent volume mount on EC2/ECS.
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public String uploadFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Cannot upload empty file");
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new BusinessException("File size must be 2MB or less");
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String extension = getExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + extension;
            Path targetPath = uploadPath.resolve(fileName);
            file.transferTo(targetPath.toFile());

            log.info("File uploaded: path={}, originalName={}", targetPath, file.getOriginalFilename());
            // Return a web-accessible relative path instead of absolute filesystem path
            return "/uploads/" + fileName;
        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage(), e);
            throw new BusinessException("File upload failed: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            File file;
            if (filePath.startsWith("/uploads/")) {
                // New relative path format — resolve from upload dir
                String filename = filePath.substring("/uploads/".length());
                Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
                file = uploadPath.resolve(filename).toFile();
            } else {
                // Legacy absolute path format
                file = new File(filePath);
            }
            if (file.exists() && file.delete()) {
                log.info("File deleted: {}", filePath);
            } else {
                log.warn("File not found for deletion: {}", filePath);
            }
        } catch (Exception e) {
            log.warn("Failed to delete file {}: {}", filePath, e.getMessage());
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
