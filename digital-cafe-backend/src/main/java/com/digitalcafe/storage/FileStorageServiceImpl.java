package com.digitalcafe.storage;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    // Uploads folder INSIDE project directory
    private final String uploadDir = System.getProperty("user.dir") + "/uploads/";

    @Override
    public String uploadFile(MultipartFile file) {

        try {
            // Create uploads folder if not exists
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            // Unique file name
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            Path fullPath = Paths.get(uploadDir, fileName);

            Files.write(fullPath, file.getBytes(), StandardOpenOption.CREATE);

            // Save absolute path to DB
            return fullPath.toString();

        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void deleteFile(String filePath) {

        try {
            if (filePath == null) return;

            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);

        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }
}