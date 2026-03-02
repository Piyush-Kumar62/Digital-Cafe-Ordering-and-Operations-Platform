package com.digitalcafe.storage;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

/**
 * File storage abstraction for uploading and deleting files.
 *
 * Implementation can be swapped between:
 * - Local disk (dev)
 * - AWS S3 pre-signed URLs (prod)
 */
public interface FileStorageService {

    /**
     * Uploads a file and returns its access path or URL.
     */
    String uploadFile(MultipartFile file);

    /**
     * Deletes a file by its path or URL.
     */
    void deleteFile(String filePath);

    /**
     * Uploads multiple files and returns a list of access paths.
     */
    default List<String> uploadFiles(List<MultipartFile> files) {
        return files.stream().map(this::uploadFile).toList();
    }
}
