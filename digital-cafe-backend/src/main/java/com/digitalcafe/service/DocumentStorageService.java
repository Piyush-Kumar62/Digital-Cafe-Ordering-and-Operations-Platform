package com.digitalcafe.service;

import org.springframework.web.multipart.MultipartFile;

public interface DocumentStorageService {

    StoredDocument storeGovtIdProof(MultipartFile file);

    record StoredDocument(
            String storedPath,
            String fileName,
            String contentType,
            long size
    ) {
    }
}

