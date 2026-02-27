package com.digitalcafe.service.impl;

import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.service.DocumentStorageService;
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@Service
public class DocumentStorageServiceImpl implements DocumentStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public StoredDocument storeGovtIdProof(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Government ID proof file is required");
        }
        if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            throw new BadRequestException("Government ID proof filename is invalid");
        }
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Unsupported government ID proof file type");
        }

        String extension = extractExtension(file.getOriginalFilename());
        String storedFileName = "govt-id-" + UUID.randomUUID() + extension;
        Path basePath = Paths.get(uploadDir, "govt-id-proofs").toAbsolutePath().normalize();
        Path targetPath = basePath.resolve(storedFileName);

        try {
            Files.createDirectories(basePath);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored govt ID proof at {}", targetPath);
            return new StoredDocument(
                    targetPath.toString(),
                    file.getOriginalFilename(),
                    contentType,
                    file.getSize()
            );
        } catch (IOException e) {
            throw new BadRequestException("Failed to store government ID proof");
        }
    }

    private String extractExtension(String fileName) {
        int idx = fileName.lastIndexOf('.');
        if (idx < 0 || idx == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(idx);
    }
}

