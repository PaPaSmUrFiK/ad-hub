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
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        // Проверяем, что пользователь является владельцем объявления
        if (!ad.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Нет доступа к загрузке медиафайлов для этого объявления");
        }

        validateImageFile(file);

        // Генерируем имя файла
        String fileName = generateMediaFileName(file);
        String storedFileName = fileStorageService.uploadFile(file, FileStorageService.ADS_MEDIA_FOLDER, fileName);
        String fileUrl = fileStorageService.getFileUrl(storedFileName);

        if (fileUrl == null) {
            throw new FileUploadException("Не удалось получить URL загруженного файла");
        }

        // Определяем порядок отображения
        long mediaCount = adMediaRepository.countByAdId(adId);
        Integer displayOrder = (int) mediaCount;

        // Если это первый файл, делаем его основным
        Boolean isPrimary = mediaCount == 0;

        // Если делаем основным, снимаем флаг с других
        if (isPrimary) {
            adMediaRepository.clearPrimaryMediaByAdId(adId);
        }

        AdMedia media = AdMedia.builder()
                .ad(ad)
                .fileUrl(fileUrl)
                .fileType(FileType.IMAGE) // Используем правильное значение из enum
                .isPrimary(isPrimary)
                .displayOrder(displayOrder)
                .build();

        AdMedia savedMedia = adMediaRepository.save(media);
        log.info("Медиафайл загружен для объявления ID={}: mediaId={}", adId, savedMedia.getId());

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
        String fileName = extractFileNameFromUrl(media.getFileUrl());
        if (fileName != null) {
            String fullPath = fileName.startsWith(FileStorageService.ADS_MEDIA_FOLDER + "/")
                    ? fileName
                    : FileStorageService.ADS_MEDIA_FOLDER + "/" + fileName;
            fileStorageService.deleteFile(fullPath);
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
            throw new FileUploadException("Размер файла не должен превышать 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new FileUploadException("Допустимые форматы: JPEG, PNG, GIF, WebP");
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

    private String extractFileNameFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        try {
            String[] parts = url.split("/");
            String fileNameWithParams = parts[parts.length - 1];
            return fileNameWithParams.split("\\?")[0];
        } catch (Exception e) {
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

