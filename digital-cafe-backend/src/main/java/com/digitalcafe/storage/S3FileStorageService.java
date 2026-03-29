package com.digitalcafe.storage;

import com.digitalcafe.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;
import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "s3")
public class S3FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final String bucket;
    private final String baseUrl;
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    private static final java.util.Set<String> PROFILE_TYPES = java.util.Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/avif",
            "image/gif"
    );
    private static final java.util.Set<String> MENU_TYPES = java.util.Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif"
    );
    private static final java.util.Set<String> GENERAL_TYPES = java.util.Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/avif",
            "image/gif"
    );

    public S3FileStorageService(
            @Value("${aws.s3.bucket}") String bucket,
            @Value("${aws.s3.region:ap-south-1}") String region,
            @Value("${aws.credentials.access-key:}") String accessKey,
            @Value("${aws.credentials.secret-key:}") String secretKey,
            @Value("${aws.s3.base-url:}") String baseUrl) {
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("S3 bucket is not configured. Set S3_BUCKET for deploy profile.");
        }
        this.bucket = bucket;
        this.baseUrl = (baseUrl == null || baseUrl.isBlank())
                ? ("https://" + bucket + ".s3." + region + ".amazonaws.com")
                : baseUrl;

        S3Client client;
        if (accessKey != null && !accessKey.isBlank() && secretKey != null && !secretKey.isBlank()) {
            client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(
                            StaticCredentialsProvider.create(
                                    AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
        } else {
            client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
        }
        this.s3Client = client;
    }

    @Override
    public String uploadFile(MultipartFile file) {
        return uploadWithPrefix(file, "cafes", GENERAL_TYPES);
    }

    @Override
    public String storeProfileImage(MultipartFile file) {
        return uploadWithPrefix(file, "profile", PROFILE_TYPES);
    }

    @Override
    public String storeMenuItemImage(MultipartFile file) {
        return uploadWithPrefix(file, "menu-items", MENU_TYPES);
    }

    @Override
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        try {
            String key = extractKey(filePath);
            if (key == null || key.isBlank()) {
                return;
            }
            s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
            log.info("Deleted file from S3 bucket={}, key={}", bucket, key);
        } catch (Exception ex) {
            log.warn("Failed to delete S3 object {}: {}", filePath, ex.getMessage());
        }
    }

    private String extractKey(String filePath) {
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            URI uri = URI.create(filePath);
            String path = uri.getPath();
            return path.startsWith("/") ? path.substring(1) : path;
        }
        if (filePath.startsWith("s3://")) {
            String withoutScheme = filePath.substring("s3://".length());
            int slashIndex = withoutScheme.indexOf('/');
            if (slashIndex < 0) {
                return "";
            }
            return withoutScheme.substring(slashIndex + 1);
        }
        return filePath.replace("\\", "/").replaceFirst("^/+", "");
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    private String uploadWithPrefix(MultipartFile file, String prefix, java.util.Set<String> allowedTypes) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Cannot upload empty file");
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new BusinessException("Unsupported file type: " + (contentType != null ? contentType : "unknown"));
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException("File size must be 2MB or less");
        }

        try {
            String extension = resolveExtension(contentType, file.getOriginalFilename());
            String key = prefix + "/" + UUID.randomUUID() + extension;

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(file.getBytes()));
            String url = baseUrl + "/" + key;
            log.info("Uploaded file to S3 bucket={}, key={}", bucket, key);
            return url;
        } catch (Exception ex) {
            log.error("S3 upload failed: {}", ex.getMessage(), ex);
            throw new BusinessException("File upload failed: " + ex.getMessage());
        }
    }

    private String resolveExtension(String contentType, String originalFilename) {
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
