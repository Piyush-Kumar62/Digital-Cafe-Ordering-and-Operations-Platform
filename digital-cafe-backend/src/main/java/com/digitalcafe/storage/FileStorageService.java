package com.digitalcafe.storage;

import org.springframework.web.multipart.MultipartFile;
import java.util.List;

/**
 * File storage abstraction for uploading and deleting files.
 *
 * Implementation can be swapped between:
 * - Local disk (dev)
 * - AWS S3 pre-signed URLs (deployment)
 */
public interface FileStorageService {

    /**
     * Uploads a file and returns its access path or URL.
     */
    String uploadFile(MultipartFile file);

    /**
     * Uploads a profile image and returns its access path or URL.
     */
    String storeProfileImage(MultipartFile file);

    /**
     * Uploads a menu item image and returns its access path or URL.
     */
    String storeMenuItemImage(MultipartFile file);

    /**
     * Uploads a cafe gallery image and returns its access path or URL.
     */
    String storeGalleryImage(MultipartFile file);

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
