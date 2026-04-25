package com.whitenights.common.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String uploadFile(String bucket, String filename, MultipartFile file);
    void deleteFile(String bucket, String filename);
}
