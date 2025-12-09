package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.AccessDeniedException;
import com.bsuir.adhubbackand.exception.AdNotFoundException;
import com.bsuir.adhubbackand.exception.FileUploadException;
import com.bsuir.adhubbackand.model.dto.response.AdMediaResponse;
import com.bsuir.adhubbackand.model.entities.Ad;
import com.bsuir.adhubbackand.model.entities.AdMedia;
import com.bsuir.adhubbackand.model.enums.FileType;
import com.bsuir.adhubbackand.repositories.AdMediaRepository;
import com.bsuir.adhubbackand.repositories.AdRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdMediaService {

    private final AdRepository adRepository;
    private final AdMediaRepository adMediaRepository;
    private final FileStorageService fileStorageService;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Transactional
    public AdMediaResponse uploadMedia(Long adId, Long userId, MultipartFile file) {
        log.info("Начало загрузки медиафайла для объявления ID={}, пользователь ID={}, файл: {}", 
                adId, userId, file.getOriginalFilename());
        
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        // Проверяем, что пользователь является владельцем объявления
        if (!ad.getUser().getId().equals(userId)) {
            log.warn("Попытка загрузки медиафайла пользователем {} для объявления {}, принадлежащего пользователю {}", 
                    userId, adId, ad.getUser().getId());
            throw new AccessDeniedException("Нет доступа к загрузке медиафайлов для этого объявления");
        }

        validateImageFile(file);
        log.info("Валидация файла прошла успешно, размер: {} байт", file.getSize());

        // Генерируем имя файла
        String fileName = generateMediaFileName(file);
        log.info("Сгенерировано имя файла: {}", fileName);
        
        String fileUrl;
        try {
            String storedFileName = fileStorageService.uploadFile(file, FileStorageService.ADS_MEDIA_FOLDER, fileName);
            log.info("Файл загружен в хранилище: {}", storedFileName);
            
            // Небольшая задержка перед получением URL, чтобы MinIO успел обработать файл
            try {
                Thread.sleep(100);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                log.warn("Прервано ожидание перед получением URL файла");
            }
            
            fileUrl = fileStorageService.getFileUrl(storedFileName);
            log.info("Получен URL файла: {}", fileUrl != null ? fileUrl.substring(0, Math.min(100, fileUrl.length())) + "..." : "null");

            if (fileUrl == null) {
                log.error("Не удалось получить URL для файла: {}", storedFileName);
                throw new FileUploadException("Не удалось получить URL загруженного файла. Файл может быть еще не обработан MinIO.");
            }
        } catch (FileUploadException e) {
            log.error("Ошибка при загрузке файла в MinIO: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Неожиданная ошибка при загрузке файла: {}", e.getMessage(), e);
            throw new FileUploadException("Не удалось загрузить файл: " + e.getMessage(), e);
        }

        // Определяем порядок отображения - используем синхронизацию для избежания race condition
        // при параллельной загрузке нескольких файлов
        Integer displayOrder;
        Boolean isPrimary;
        synchronized (this) {
            long mediaCount = adMediaRepository.countByAdId(adId);
            displayOrder = (int) mediaCount;

            // Если это первый файл, делаем его основным
            isPrimary = mediaCount == 0;

            // Если делаем основным, снимаем флаг с других
            if (isPrimary) {
                adMediaRepository.clearPrimaryMediaByAdId(adId);
            }
        }

        AdMedia media = AdMedia.builder()
                .ad(ad)
                .fileUrl(fileUrl)
                .fileType(FileType.IMAGE) // Используем правильное значение из enum
                .isPrimary(isPrimary)
                .displayOrder(displayOrder)
                .build();

        AdMedia savedMedia = adMediaRepository.save(media);
        
        // После сохранения пересчитываем порядок для всех медиафайлов объявления
        // чтобы гарантировать правильную последовательность
        List<AdMedia> allMedia = adMediaRepository.findByAdIdOrderByDisplayOrderAsc(adId);
        for (int i = 0; i < allMedia.size(); i++) {
            if (!allMedia.get(i).getDisplayOrder().equals(i)) {
                allMedia.get(i).setDisplayOrder(i);
                adMediaRepository.save(allMedia.get(i));
            }
        }
        log.info("Медиафайл успешно сохранен в БД для объявления ID={}: mediaId={}, fileUrl={}", 
                adId, savedMedia.getId(), savedMedia.getFileUrl());

        return mapToResponse(savedMedia);
    }

    @Transactional
    public void deleteMedia(Long adId, Long mediaId, Long userId) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        // Проверяем, что пользователь является владельцем объявления
        if (!ad.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Нет доступа к удалению медиафайлов этого объявления");
        }

        AdMedia media = adMediaRepository.findById(mediaId)
                .orElseThrow(() -> new RuntimeException("Медиафайл не найден"));

        // Проверяем, что медиафайл принадлежит объявлению
        if (!media.getAd().getId().equals(adId)) {
            throw new RuntimeException("Медиафайл не принадлежит этому объявлению");
        }

        // Удаляем файл из MinIO
        // FileStorageService теперь возвращает путь в формате "bucketName/filename"
        // или мы можем извлечь из URL и передать напрямую
        String fileUrl = media.getFileUrl();
        if (fileUrl != null) {
            // Извлекаем путь из URL (убираем параметры запроса)
            String filePath = extractFilePathFromUrl(fileUrl);
            if (filePath != null) {
                fileStorageService.deleteFile(filePath);
            }
        }

        // Если это был основной файл, делаем основной следующий по порядку
        if (Boolean.TRUE.equals(media.getIsPrimary())) {
            List<AdMedia> otherMedia = adMediaRepository.findByAdIdOrderByDisplayOrderAsc(adId);
            otherMedia.remove(media);
            if (!otherMedia.isEmpty()) {
                AdMedia newPrimary = otherMedia.get(0);
                newPrimary.setIsPrimary(true);
                adMediaRepository.save(newPrimary);
            }
        }

        adMediaRepository.delete(media);
        log.info("Медиафайл удален: adId={}, mediaId={}", adId, mediaId);
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileUploadException("Файл не должен быть пустым");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileUploadException(String.format(
                "Размер файла '%s' превышает максимально допустимый размер 10MB. Текущий размер: %.2f MB",
                file.getOriginalFilename(),
                file.getSize() / (1024.0 * 1024.0)
            ));
        }

        String contentType = file.getContentType();
        String fileName = file.getOriginalFilename();
        
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new FileUploadException(String.format(
                "Файл '%s' имеет неподдерживаемый формат. Допустимые форматы: JPEG, JPG, PNG, GIF, WebP. Получен формат: %s",
                fileName != null ? fileName : "неизвестный файл",
                contentType != null ? contentType : "не определен"
            ));
        }
    }

    private String generateMediaFileName(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        return "ad_" + UUID.randomUUID() + fileExtension;
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return ".jpg";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }

    /**
     * Извлекает путь к файлу из presigned URL
     * URL может содержать bucket name в пути или параметрах
     */
    private String extractFilePathFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        try {
            // Presigned URL обычно имеет формат: http://host:port/bucketName/filename?params
            // Или может быть в другом формате
            // Пытаемся извлечь bucket и filename из URL
            java.net.URI uri = new java.net.URI(url);
            java.net.URL urlObj = uri.toURL();
            String path = urlObj.getPath();
            
            // Убираем первый слэш если есть
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            
            // Убираем параметры запроса
            String query = urlObj.getQuery();
            if (query != null && path.contains("?")) {
                path = path.split("\\?")[0];
            }
            
            // Если путь содержит bucket name (adhub-ads-media или adhub-avatars), возвращаем как есть
            // Иначе пытаемся определить по имени файла
            if (path.contains("adhub-")) {
                return path; // Уже содержит bucket name
            } else {
                // Для обратной совместимости: если файл начинается с "ad_", это медиа объявления
                String fileName = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
                if (fileName.startsWith("ad_")) {
                    // Возвращаем путь с bucket name для медиа объявлений
                    return "adhub-ads-media/" + fileName;
                }
                return path;
            }
        } catch (Exception e) {
            log.warn("Не удалось извлечь путь из URL: {}", url, e);
            return null;
        }
    }

    private AdMediaResponse mapToResponse(AdMedia media) {
        return new AdMediaResponse(
                media.getId(),
                media.getFileUrl(),
                media.getFileType().name(),
                media.getIsPrimary(),
                media.getDisplayOrder()
        );
    }
}

