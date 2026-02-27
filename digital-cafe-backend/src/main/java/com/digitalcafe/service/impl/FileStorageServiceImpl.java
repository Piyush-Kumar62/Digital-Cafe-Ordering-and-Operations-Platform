package com.digitalcafe.service.impl;

import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.service.FileStorageService;
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

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final long MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/png", "image/jpeg");

    private final Path rootUploadPath;

    public FileStorageServiceImpl(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.rootUploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
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

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }

        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Only PNG or JPEG images are allowed");
        }

        if (file.getSize() > MAX_PROFILE_IMAGE_SIZE) {
            throw new BadRequestException("Image file size must be 2MB or less");
        }
    }

    private String resolveExtension(String contentType) {
        return "image/png".equals(contentType) ? ".png" : ".jpg";
    }
}
