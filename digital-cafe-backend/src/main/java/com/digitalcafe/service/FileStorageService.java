package com.digitalcafe.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String storeProfileImage(MultipartFile file);
    String storeMenuItemImage(MultipartFile file);
}
