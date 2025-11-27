package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.FileUploadException;
import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    // Константы для папок
    public static final String AVATARS_FOLDER = "avatars";
    public static final String ADS_MEDIA_FOLDER = "ads-media";

    public String uploadFile(MultipartFile file, String folder, String customFileName) {
        try {
            ensureBucketExists();

            String fileName;
            if (customFileName != null) {
                fileName = folder + "/" + customFileName;
            } else {
                String originalFileName = file.getOriginalFilename();
                String fileExtension = getFileExtension(originalFileName);
                fileName = folder + "/" + UUID.randomUUID() + fileExtension;
            }

            log.info("Загрузка файла в папку '{}': {}", folder, fileName);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("Файл успешно загружен в MinIO в папку '{}': {}", folder, fileName);
            return fileName;

        } catch (Exception e) {
            log.error("Ошибка загрузки файла в MinIO: {}", e.getMessage(), e);
            throw new FileUploadException("Не удалось загрузить файл: " + e.getMessage(), e);
        }
    }

    public String getFileUrl(String fileName) {
        try {
            ensureBucketExists();
            
            // Проверяем существование файла
            try {
                minioClient.statObject(
                        StatObjectArgs.builder()
                                .bucket(bucketName)
                                .object(fileName)
                                .build()
                );
            } catch (ErrorResponseException e) {
                if (e.errorResponse().code().equals("NoSuchKey")) {
                    log.warn("Файл не найден в MinIO: {}", fileName);
                    return null;
                }
                throw e;
            }

            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(fileName)
                            .expiry(7, TimeUnit.DAYS)
                            .build()
            );
        } catch (Exception e) {
            log.error("Ошибка получения URL файла: {}", e.getMessage());
            return null; // Возвращаем null вместо исключения для более мягкой обработки
        }
    }

    public void deleteFile(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            log.warn("Попытка удалить файл с пустым именем");
            return;
        }

        try {
            ensureBucketExists();
            
            // Проверяем существование файла перед удалением
            try {
                minioClient.statObject(
                        StatObjectArgs.builder()
                                .bucket(bucketName)
                                .object(fileName)
                                .build()
                );
            } catch (ErrorResponseException e) {
                if (e.errorResponse().code().equals("NoSuchKey")) {
                    log.warn("Файл не найден в MinIO, пропускаем удаление: {}", fileName);
                    return;
                }
                throw e;
            }

            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .build()
            );
            log.info("Файл удален из MinIO: {}", fileName);
        } catch (Exception e) {
            log.warn("Ошибка удаления файла из MinIO (продолжаем работу): {}", e.getMessage());
            // Не бросаем исключение, чтобы не нарушать работу приложения
        }
    }

    /**
     * Проверяет существование bucket и создает его при необходимости.
     * Этот метод вызывается как дополнительная проверка перед операциями с файлами.
     * Основная инициализация bucket происходит при старте приложения в MinioConfig.
     */
    private void ensureBucketExists() {
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (!found) {
                log.warn("Bucket '{}' не найден при выполнении операции, создаем...", bucketName);
                minioClient.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                log.info("Bucket '{}' успешно создан в MinIO", bucketName);
            }
        } catch (ErrorResponseException e) {
            log.error("Ошибка MinIO при проверке/создании bucket '{}': {} (код: {})", 
                    bucketName, e.getMessage(), e.errorResponse().code(), e);
            // Пробрасываем исключение, так как без bucket операции с файлами невозможны
            throw new FileUploadException("Ошибка MinIO: " + e.getMessage(), e);
        } catch (InsufficientDataException | InternalException | InvalidKeyException |
                 InvalidResponseException | IOException | NoSuchAlgorithmException |
                 ServerException | XmlParserException e) {
            log.error("Ошибка при проверке/создании bucket '{}' в MinIO: {}", bucketName, e.getMessage(), e);
            // Пробрасываем исключение, так как без bucket операции с файлами невозможны
            throw new FileUploadException("Ошибка при работе с MinIO: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Неожиданная ошибка при проверке/создании bucket '{}' в MinIO: {}", bucketName, e.getMessage(), e);
            throw new FileUploadException("Неожиданная ошибка при работе с MinIO: " + e.getMessage(), e);
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return ".jpg";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}