package com.bsuir.adhubbackand.config;

import io.minio.*;
import io.minio.errors.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Component
@RequiredArgsConstructor
public class MinioInitializer implements CommandLineRunner {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    /**
     * Инициализация MinIO bucket при старте приложения
     */
    @Override
    public void run(String... args) {
        try {
            log.info("Инициализация MinIO bucket: {}", bucketName);
            
            // Проверяем существование bucket
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (!found) {
                log.info("Bucket '{}' не найден, создаем...", bucketName);
                minioClient.makeBucket(MakeBucketArgs.builder()
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
            log.error("Неожиданная ошибка при инициализации bucket '{}': {}", bucketName, e.getMessage(), e);
            throw new RuntimeException("Не удалось инициализировать MinIO bucket: " + e.getMessage(), e);
        }
    }
}

