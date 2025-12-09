package com.bsuir.adhubbackand.config;

import io.minio.*;
import io.minio.errors.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(2) // Выполняется после DataInitializer
public class MinioInitializer implements CommandLineRunner {

    private final MinioClient minioClient;

    @Value("${minio.bucket.avatars}")
    private String avatarsBucketName;

    @Value("${minio.bucket.ads-media}")
    private String adsMediaBucketName;

    @Value("${minio.url}")
    private String minioUrl;

    /**
     * Инициализация MinIO buckets при старте приложения
     */
    @Override
    public void run(String... args) {
        log.info("=== Начало инициализации MinIO buckets ===");
        log.info("Bucket для аватаров: {}", avatarsBucketName);
        log.info("Bucket для медиа объявлений: {}", adsMediaBucketName);
        
        try {
            // Проверяем подключение к MinIO
            checkMinioConnection();
            
            // Инициализируем bucket для аватаров
            initializeBucket(avatarsBucketName, "аватаров");
            
            // Инициализируем bucket для медиа объявлений
            initializeBucket(adsMediaBucketName, "медиа объявлений");
            
            log.info("=== Инициализация MinIO buckets завершена успешно ===");
        } catch (Exception e) {
            log.error("=== КРИТИЧЕСКАЯ ОШИБКА при инициализации MinIO ===", e);
            log.error("Не удалось подключиться к MinIO или инициализировать buckets");
            log.error("Убедитесь, что MinIO запущен и доступен по адресу: {}", minioUrl);
            log.error("Проверьте настройки подключения в application.properties:");
            log.error("  - minio.url");
            log.error("  - minio.access-key");
            log.error("  - minio.secret-key");
            log.error("Приложение не может быть запущено без подключения к MinIO");
            // Бросаем исключение, чтобы остановить запуск приложения
            throw new RuntimeException("КРИТИЧЕСКАЯ ОШИБКА: Не удалось подключиться к MinIO. Приложение не может быть запущено.", e);
        }
    }

    /**
     * Проверяет подключение к MinIO
     */
    private void checkMinioConnection() {
        try {
            log.info("Проверка подключения к MinIO...");
            // Пытаемся выполнить простую операцию для проверки подключения
            minioClient.listBuckets();
            log.info("Подключение к MinIO успешно установлено");
        } catch (Exception e) {
            log.error("Не удалось подключиться к MinIO: {}", e.getMessage());
            log.error("Убедитесь, что MinIO запущен и доступен по адресу, указанному в application.properties");
            throw new RuntimeException("MinIO недоступен: " + e.getMessage(), e);
        }
    }

    private void initializeBucket(String bucketName, String description) {
        int maxRetries = 3;
        int retryDelay = 2000; // 2 секунды
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                log.info("[Попытка {}/{}] Инициализация MinIO bucket для {}: {}", 
                        attempt, maxRetries, description, bucketName);
                
                // Проверяем существование bucket
                boolean found = minioClient.bucketExists(BucketExistsArgs.builder()
                        .bucket(bucketName)
                        .build());

                if (!found) {
                    log.info("Bucket '{}' не найден, создаем...", bucketName);
                    minioClient.makeBucket(MakeBucketArgs.builder()
                            .bucket(bucketName)
                            .build());
                    log.info("✓ Bucket '{}' успешно создан в MinIO для {}", bucketName, description);
                } else {
                    log.info("✓ Bucket '{}' уже существует в MinIO для {}", bucketName, description);
                }
                
                // Проверяем, что bucket действительно доступен
                boolean verified = minioClient.bucketExists(BucketExistsArgs.builder()
                        .bucket(bucketName)
                        .build());
                
                if (verified) {
                    log.info("✓ Bucket '{}' успешно проверен и готов к использованию", bucketName);
                    return; // Успешно создан/проверен
                } else {
                    throw new RuntimeException("Bucket '" + bucketName + "' не найден после создания");
                }
                
            } catch (ErrorResponseException e) {
                String errorCode = e.errorResponse() != null ? e.errorResponse().code() : "UNKNOWN";
                log.error("[Попытка {}/{}] Ошибка MinIO при инициализации bucket '{}' для {}: {} (код: {})", 
                        attempt, maxRetries, bucketName, description, e.getMessage(), errorCode);
                
                if (attempt == maxRetries) {
                    log.error("Не удалось создать bucket '{}' после {} попыток", bucketName, maxRetries);
                    throw new RuntimeException("Не удалось инициализировать MinIO bucket '" + bucketName + "': " + e.getMessage(), e);
                }
                
                // Ждем перед повторной попыткой
                try {
                    Thread.sleep(retryDelay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Прервано при ожидании перед повторной попыткой", ie);
                }
                
            } catch (InsufficientDataException | InternalException | InvalidKeyException |
                     InvalidResponseException | IOException | NoSuchAlgorithmException |
                     ServerException | XmlParserException e) {
                log.error("[Попытка {}/{}] Ошибка при инициализации MinIO bucket '{}' для {}: {}", 
                        attempt, maxRetries, bucketName, description, e.getMessage());
                
                if (attempt == maxRetries) {
                    throw new RuntimeException("Не удалось инициализировать MinIO bucket '" + bucketName + "': " + e.getMessage(), e);
                }
                
                try {
                    Thread.sleep(retryDelay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Прервано при ожидании перед повторной попыткой", ie);
                }
                
            } catch (Exception e) {
                log.error("[Попытка {}/{}] Неожиданная ошибка при инициализации bucket '{}' для {}: {}", 
                        attempt, maxRetries, bucketName, description, e.getMessage(), e);
                
                if (attempt == maxRetries) {
                    throw new RuntimeException("Не удалось инициализировать MinIO bucket '" + bucketName + "': " + e.getMessage(), e);
                }
                
                try {
                    Thread.sleep(retryDelay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Прервано при ожидании перед повторной попыткой", ie);
                }
            }
        }
    }
}

