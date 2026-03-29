package com.digitalcafe.storage;

import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.exception.FileTooLargeException;
import com.digitalcafe.exception.InvalidFileTypeException;
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
import java.util.Set;
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

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    private static final Set<String> PROFILE_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/avif",
            "image/gif"
    );
    private static final Set<String> MENU_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif"
    );
    private static final Set<String> GENERAL_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/avif",
            "image/gif"
    );

    @Override
    public String uploadFile(MultipartFile file) {
        validate(file, GENERAL_TYPES, MAX_FILE_SIZE);
        return store(file, "", GENERAL_TYPES);
    }

    @Override
    public String storeProfileImage(MultipartFile file) {
        validate(file, PROFILE_TYPES, MAX_FILE_SIZE);
        return store(file, "profile", PROFILE_TYPES);
    }

    @Override
    public String storeMenuItemImage(MultipartFile file) {
        validate(file, MENU_TYPES, MAX_FILE_SIZE);
        return store(file, "menu-items", MENU_TYPES);
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

    private void validate(MultipartFile file, Set<String> allowedTypes, long maxBytes) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Cannot upload empty file");
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new InvalidFileTypeException(
                    contentType != null ? contentType : "unknown",
                    allowedTypes
            );
        }
        if (file.getSize() > maxBytes) {
            throw new FileTooLargeException(maxBytes);
        }
    }

    private String store(MultipartFile file, String subDir, Set<String> allowedTypes) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path targetDir = subDir == null || subDir.isBlank()
                    ? uploadPath
                    : uploadPath.resolve(subDir).normalize();
            if (!targetDir.startsWith(uploadPath)) {
                throw new BusinessException("Invalid upload path");
            }
            Files.createDirectories(targetDir);

            String extension = resolveExtension(file.getContentType(), file.getOriginalFilename(), allowedTypes);
            String fileName = UUID.randomUUID() + extension;
            Path targetPath = targetDir.resolve(fileName).normalize();
            if (!targetPath.startsWith(targetDir)) {
                throw new BusinessException("Invalid file destination");
            }
            file.transferTo(targetPath.toFile());

            String prefix = subDir == null || subDir.isBlank() ? "" : (subDir + "/");
            return "/uploads/" + prefix + fileName;
        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage(), e);
            throw new BusinessException("File upload failed: " + e.getMessage());
        }
    }

    private String resolveExtension(String contentType, String originalFilename, Set<String> allowedTypes) {
        if (contentType != null) {
            return switch (contentType) {
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                case "image/avif" -> ".avif";
                case "image/gif" -> ".gif";
                default -> ".jpg";
            };
        }
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf('.'));
        }
        return ".jpg";
    }
}
