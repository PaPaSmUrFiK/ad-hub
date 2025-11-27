package com.bsuir.adhubbackand.config;

import io.minio.*;
import io.minio.errors.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Configuration
public class MinioConfig {

    @Value("${minio.url}")
    private String minioUrl;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket-name}")
    private String bucketName;

    private MinioClient minioClientInstance;

    @Bean
    public MinioClient minioClient() {
        if (minioClientInstance == null) {
            minioClientInstance = MinioClient.builder()
                    .endpoint(minioUrl)
                    .credentials(accessKey, secretKey)
                    .build();
        }
        return minioClientInstance;
    }

    @Bean
    public String bucketName() {
        return bucketName;
    }

    /**
     * Инициализация MinIO bucket при старте приложения
     */
    @PostConstruct
    public void initMinioBucket() {
        try {
            log.info("Инициализация MinIO bucket: {}", bucketName);
            MinioClient client = minioClient();
            
            // Проверяем существование bucket
            boolean found = client.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (!found) {
                log.info("Bucket '{}' не найден, создаем...", bucketName);
                client.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                log.info("Bucket '{}' успешно создан в MinIO", bucketName);
            } else {
                log.info("Bucket '{}' уже существует в MinIO", bucketName);
            }
        } catch (ErrorResponseException e) {
            log.error("Ошибка MinIO при инициализации bucket '{}': {} (код: {})", 
                    bucketName, e.getMessage(), e.errorResponse().code(), e);
            throw new RuntimeException("Не удалось инициализировать MinIO bucket: " + e.getMessage(), e);
        } catch (InsufficientDataException | InternalException | InvalidKeyException |
                 InvalidResponseException | IOException | NoSuchAlgorithmException |
                 ServerException | XmlParserException e) {
            log.error("Ошибка при инициализации MinIO bucket '{}': {}", bucketName, e.getMessage(), e);
            throw new RuntimeException("Не удалось инициализировать MinIO bucket: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Неожиданная ошибка при инициализации MinIO bucket '{}': {}", bucketName, e.getMessage(), e);
            throw new RuntimeException("Не удалось инициализировать MinIO bucket: " + e.getMessage(), e);
        }
    }
}