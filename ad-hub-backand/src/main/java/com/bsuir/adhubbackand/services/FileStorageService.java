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

    @Value("${minio.bucket.avatars}")
    private String avatarsBucketName;

    @Value("${minio.bucket.ads-media}")
    private String adsMediaBucketName;

    // Константы для папок (теперь используются только для организации внутри bucket)
    public static final String AVATARS_FOLDER = "avatars";
    public static final String ADS_MEDIA_FOLDER = "ads-media";

    /**
     * Загружает файл в соответствующий bucket в зависимости от типа
     * @param file файл для загрузки
     * @param folder тип файла (AVATARS_FOLDER или ADS_MEDIA_FOLDER)
     * @param customFileName имя файла (опционально)
     * @return путь к файлу в формате "folder/filename"
     */
    public String uploadFile(MultipartFile file, String folder, String customFileName) {
        try {
            // Определяем bucket в зависимости от типа файла
            String bucketName = getBucketNameForFolder(folder);
            ensureBucketExists(bucketName);

            String fileName;
            if (customFileName != null) {
                fileName = customFileName; // Не добавляем folder, так как bucket уже разделяет типы
            } else {
                String originalFileName = file.getOriginalFilename();
                String fileExtension = getFileExtension(originalFileName);
                fileName = UUID.randomUUID() + fileExtension;
            }

            log.info("Загрузка файла в bucket '{}', папка '{}', файл: {}", bucketName, folder, fileName);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("Файл успешно загружен в MinIO: bucket='{}', файл='{}'", bucketName, fileName);
            // Возвращаем путь с указанием bucket для последующего использования
            return bucketName + "/" + fileName;

        } catch (Exception e) {
            log.error("Ошибка загрузки файла в MinIO: {}", e.getMessage(), e);
            throw new FileUploadException("Не удалось загрузить файл: " + e.getMessage(), e);
        }
    }

    /**
     * Получает URL файла
     * @param filePath путь к файлу в формате "bucketName/filename" или просто "filename" (для обратной совместимости)
     * @return presigned URL или null если файл не найден
     */
    public String getFileUrl(String filePath) {
        try {
            String bucketName;
            String fileName;
            
            // Парсим путь: может быть "bucketName/filename" или просто "filename"
            if (filePath.contains("/")) {
                String[] parts = filePath.split("/", 2);
                bucketName = parts[0];
                fileName = parts[1];
            } else {
                // Обратная совместимость: пытаемся определить bucket по имени файла
                // Если начинается с "avatar_", используем avatars bucket
                if (filePath.startsWith("avatar_")) {
                    bucketName = avatarsBucketName;
                    fileName = filePath;
                } else {
                    bucketName = adsMediaBucketName;
                    fileName = filePath;
                }
            }
            
            log.info("Получение URL для файла: bucket='{}', файл='{}'", bucketName, fileName);
            ensureBucketExists(bucketName);
            
            // Проверяем существование файла с повторными попытками
            // (файл может быть еще не полностью обработан MinIO сразу после загрузки)
            int maxRetries = 3;
            boolean fileExists = false;
            
            for (int attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    minioClient.statObject(
                            StatObjectArgs.builder()
                                    .bucket(bucketName)
                                    .object(fileName)
                                    .build()
                    );
                    fileExists = true;
                    log.info("Файл найден в MinIO: bucket='{}', файл='{}' (попытка {}/{})", bucketName, fileName, attempt, maxRetries);
                    break;
                } catch (ErrorResponseException e) {
                    if (e.errorResponse().code().equals("NoSuchKey")) {
                        if (attempt < maxRetries) {
                            log.warn("Файл не найден в MinIO (попытка {}/{}), повторяем через 500мс: bucket='{}', файл='{}'", 
                                    attempt, maxRetries, bucketName, fileName);
                            try {
                                Thread.sleep(500); // Небольшая задержка перед повторной попыткой
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                log.error("Прервано при ожидании перед повторной попыткой проверки файла");
                                return null;
                            }
                        } else {
                            log.error("Файл не найден в MinIO после {} попыток: bucket='{}', файл='{}'", maxRetries, bucketName, fileName);
                            return null;
                        }
                    } else {
                        log.error("Ошибка MinIO при проверке файла: bucket='{}', файл='{}', код: {}", 
                                bucketName, fileName, e.errorResponse().code(), e);
                        throw e;
                    }
                }
            }
            
            if (!fileExists) {
                log.error("Не удалось подтвердить существование файла после {} попыток: bucket='{}', файл='{}'", 
                        maxRetries, bucketName, fileName);
                return null;
            }

            String presignedUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(fileName)
                            .expiry(7, TimeUnit.DAYS)
                            .build()
            );
            
            log.info("Presigned URL успешно получен для файла: bucket='{}', файл='{}'", bucketName, fileName);
            return presignedUrl;
        } catch (Exception e) {
            log.error("Ошибка получения URL файла '{}': {}", filePath, e.getMessage(), e);
            return null; // Возвращаем null вместо исключения для более мягкой обработки
        }
    }

    /**
     * Удаляет файл
     * @param filePath путь к файлу в формате "bucketName/filename" или просто "filename"
     */
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            log.warn("Попытка удалить файл с пустым путем");
            return;
        }

        try {
            String bucketName;
            String fileName;
            
            // Парсим путь: может быть "bucketName/filename" или просто "filename"
            if (filePath.contains("/")) {
                String[] parts = filePath.split("/", 2);
                bucketName = parts[0];
                fileName = parts[1];
            } else {
                // Обратная совместимость: пытаемся определить bucket по имени файла
                if (filePath.startsWith("avatar_") || filePath.startsWith("avatars/")) {
                    bucketName = avatarsBucketName;
                    fileName = filePath.replace("avatars/", "");
                } else {
                    bucketName = adsMediaBucketName;
                    fileName = filePath.replace("ads-media/", "");
                }
            }
            
            ensureBucketExists(bucketName);
            
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
                    log.warn("Файл не найден в MinIO, пропускаем удаление: bucket='{}', файл='{}'", bucketName, fileName);
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
            log.info("Файл удален из MinIO: bucket='{}', файл='{}'", bucketName, fileName);
        } catch (Exception e) {
            log.warn("Ошибка удаления файла из MinIO (продолжаем работу): {}", e.getMessage());
            // Не бросаем исключение, чтобы не нарушать работу приложения
        }
    }

    /**
     * Определяет bucket name в зависимости от типа папки
     */
    private String getBucketNameForFolder(String folder) {
        if (AVATARS_FOLDER.equals(folder)) {
            return avatarsBucketName;
        } else if (ADS_MEDIA_FOLDER.equals(folder)) {
            return adsMediaBucketName;
        } else {
            log.warn("Неизвестный тип папки '{}', используем bucket для объявлений по умолчанию", folder);
            return adsMediaBucketName;
        }
    }

    /**
     * Проверяет существование bucket и создает его при необходимости.
     * Этот метод вызывается как дополнительная проверка перед операциями с файлами.
     * Основная инициализация bucket происходит при старте приложения в MinioInitializer.
     */
    private void ensureBucketExists(String bucketName) {
        int maxRetries = 3;
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                log.debug("Проверка существования bucket '{}' (попытка {}/{})", bucketName, attempt, maxRetries);
                
                boolean found = minioClient.bucketExists(BucketExistsArgs.builder()
                        .bucket(bucketName)
                        .build());

                if (!found) {
                    log.warn("Bucket '{}' не найден при выполнении операции, создаем... (попытка {}/{})", 
                            bucketName, attempt, maxRetries);
                    
                    minioClient.makeBucket(MakeBucketArgs.builder()
                            .bucket(bucketName)
                            .build());
                    
                    // Проверяем, что bucket действительно создан
                    boolean verified = minioClient.bucketExists(BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build());
                    
                    if (verified) {
                        log.info("✓ Bucket '{}' успешно создан и проверен в MinIO", bucketName);
                        return;
                    } else {
                        throw new RuntimeException("Bucket '" + bucketName + "' не найден после создания");
                    }
                } else {
                    log.debug("✓ Bucket '{}' существует в MinIO", bucketName);
                    return;
                }
                
            } catch (ErrorResponseException e) {
                String errorCode = e.errorResponse() != null ? e.errorResponse().code() : "UNKNOWN";
                String errorMessage = e.getMessage();
                
                log.error("Ошибка MinIO при проверке/создании bucket '{}' (попытка {}/{}): {} (код: {})", 
                        bucketName, attempt, maxRetries, errorMessage, errorCode);
                
                // Если это ошибка "bucket does not exist" и это последняя попытка, пробрасываем исключение
                if (attempt == maxRetries || errorCode.equals("NoSuchBucket")) {
                    throw new FileUploadException(
                            String.format("Не удалось создать/найти bucket '%s' в MinIO: %s (код: %s). " +
                                    "Убедитесь, что MinIO запущен и доступен.", bucketName, errorMessage, errorCode), e);
                }
                
                // Ждем перед повторной попыткой
                try {
                    Thread.sleep(1000 * attempt); // Увеличиваем задержку с каждой попыткой
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new FileUploadException("Прервано при ожидании перед повторной попыткой создания bucket", ie);
                }
                
            } catch (InsufficientDataException | InternalException | InvalidKeyException |
                     InvalidResponseException | IOException | NoSuchAlgorithmException |
                     ServerException | XmlParserException e) {
                log.error("Ошибка при проверке/создании bucket '{}' в MinIO (попытка {}/{}): {}", 
                        bucketName, attempt, maxRetries, e.getMessage(), e);
                
                if (attempt == maxRetries) {
                    throw new FileUploadException(
                            String.format("Не удалось создать/найти bucket '%s' в MinIO: %s. " +
                                    "Проверьте подключение к MinIO.", bucketName, e.getMessage()), e);
                }
                
                try {
                    Thread.sleep(1000 * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new FileUploadException("Прервано при ожидании перед повторной попыткой", ie);
                }
                
            } catch (Exception e) {
                log.error("Неожиданная ошибка при проверке/создании bucket '{}' в MinIO (попытка {}/{}): {}", 
                        bucketName, attempt, maxRetries, e.getMessage(), e);
                
                if (attempt == maxRetries) {
                    throw new FileUploadException(
                            String.format("Неожиданная ошибка при работе с bucket '%s' в MinIO: %s", 
                                    bucketName, e.getMessage()), e);
                }
                
                try {
                    Thread.sleep(1000 * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new FileUploadException("Прервано при ожидании перед повторной попыткой", ie);
                }
            }
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return ".jpg";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}