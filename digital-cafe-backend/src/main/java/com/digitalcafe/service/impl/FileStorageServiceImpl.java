package com.digitalcafe.service.impl;

import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.FileTooLargeException;
import com.digitalcafe.exception.InvalidFileTypeException;
import com.digitalcafe.storage.FileStorageService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Deprecated(forRemoval = true)
@Service
@ConditionalOnProperty(name = "app.storage.legacy", havingValue = "true")
public class FileStorageServiceImpl implements FileStorageService {

    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    private static final long MAX_GALLERY_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_PROFILE_IMAGE_SIZE = MAX_FILE_SIZE;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/avif",
            "image/gif"
    );

    private final Path rootUploadPath;

    public FileStorageServiceImpl(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.rootUploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    public String uploadFile(MultipartFile file) {
        validate(file);

        String extension = resolveExtension(file.getContentType());
        String generatedName = UUID.randomUUID() + extension;

        Path targetDir = rootUploadPath.normalize();
        try {
            Files.createDirectories(targetDir);
            Path targetPath = targetDir.resolve(generatedName).normalize();
            if (!targetPath.startsWith(targetDir)) {
                throw new BadRequestException("Invalid file destination");
            }
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + generatedName;
        } catch (IOException e) {
            throw new BadRequestException("Failed to store file");
        }
    }

    @Override
    public String storeProfileImage(MultipartFile file) {
        validate(file);

        String extension = resolveExtension(file.getContentType());
        String generatedName = UUID.randomUUID() + extension;

        Path profileDir = rootUploadPath.resolve("profile").normalize();
        if (!profileDir.startsWith(rootUploadPath)) {
            throw new BadRequestException("Invalid upload path");
        }

        try {
            Files.createDirectories(profileDir);
            Path targetPath = profileDir.resolve(generatedName).normalize();
            if (!targetPath.startsWith(profileDir)) {
                throw new BadRequestException("Invalid file destination");
            }
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/profile/" + generatedName;
        } catch (IOException e) {
            throw new BadRequestException("Failed to store profile image");
        }
    }

    @Override
    public String storeMenuItemImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }
        String ct = file.getContentType();
        if (ct == null || !Set.of("image/png", "image/jpeg", "image/webp", "image/gif").contains(ct)) {
            throw new BadRequestException("Only PNG, JPEG, WEBP or GIF images are allowed");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("Image file size must be 2MB or less");
        }

        String extension = resolveExtension(ct);
        String generatedName = UUID.randomUUID() + extension;

        Path menuDir = rootUploadPath.resolve("menu-items").normalize();
        if (!menuDir.startsWith(rootUploadPath)) {
            throw new BadRequestException("Invalid upload path");
        }

        try {
            Files.createDirectories(menuDir);
            Path targetPath = menuDir.resolve(generatedName).normalize();
            if (!targetPath.startsWith(menuDir)) {
                throw new BadRequestException("Invalid file destination");
            }
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/menu-items/" + generatedName;
        } catch (IOException e) {
            throw new BadRequestException("Failed to store menu item image");
        }
    }

    @Override
    public String storeGalleryImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_CONTENT_TYPES.contains(ct)) {
            throw new BadRequestException("Only PNG, JPEG, WEBP, AVIF or GIF images are allowed");
        }
        if (file.getSize() > MAX_GALLERY_FILE_SIZE) {
            throw new BadRequestException("Image file size must be 5MB or less");
        }

        String extension = resolveExtension(ct);
        String generatedName = UUID.randomUUID() + extension;

        Path galleryDir = rootUploadPath.resolve("cafes").normalize();
        if (!galleryDir.startsWith(rootUploadPath)) {
            throw new BadRequestException("Invalid upload path");
        }

        try {
            Files.createDirectories(galleryDir);
            Path targetPath = galleryDir.resolve(generatedName).normalize();
            if (!targetPath.startsWith(galleryDir)) {
                throw new BadRequestException("Invalid file destination");
            }
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/cafes/" + generatedName;
        } catch (IOException e) {
            throw new BadRequestException("Failed to store gallery image");
        }
    }

    @Override
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            Path targetPath;
            if (filePath.startsWith("/uploads/")) {
                String relative = filePath.substring("/uploads/".length());
                targetPath = rootUploadPath.resolve(relative).normalize();
                if (!targetPath.startsWith(rootUploadPath)) {
                    return;
                }
            } else {
                targetPath = Paths.get(filePath).toAbsolutePath().normalize();
            }
            Files.deleteIfExists(targetPath);
        } catch (IOException ignored) {
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new InvalidFileTypeException(
                    contentType != null ? contentType : "unknown",
                    ALLOWED_CONTENT_TYPES
            );
        }

        if (file.getSize() > MAX_PROFILE_IMAGE_SIZE) {
            throw new FileTooLargeException(MAX_PROFILE_IMAGE_SIZE);
        }
    }

    private String resolveExtension(String contentType) {
        if (contentType == null) return ".jpg";
        return switch (contentType) {
            case "image/png"  -> ".png";
            case "image/webp" -> ".webp";
            case "image/avif" -> ".avif";
            case "image/gif"  -> ".gif";
            default           -> ".jpg";
        };
    }
}
