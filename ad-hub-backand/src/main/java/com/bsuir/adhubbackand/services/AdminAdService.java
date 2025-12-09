package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.AdNotFoundException;
import com.bsuir.adhubbackand.exception.AdStatusNotAllowedException;
import com.bsuir.adhubbackand.model.dto.response.admin.ModerationActionResponse;
import com.bsuir.adhubbackand.model.dto.response.admin.PendingAdResponse;
import com.bsuir.adhubbackand.model.entities.Ad;
import com.bsuir.adhubbackand.model.entities.AdMedia;
import com.bsuir.adhubbackand.model.enums.AdStatus;
import com.bsuir.adhubbackand.repositories.AdCommentRepository;
import com.bsuir.adhubbackand.repositories.AdMediaRepository;
import com.bsuir.adhubbackand.repositories.AdRepository;
import com.bsuir.adhubbackand.repositories.FavoriteAdRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAdService {

    private final AdRepository adRepository;
    private final NotificationService notificationService;
    private final AdMediaRepository adMediaRepository;
    private final FavoriteAdRepository favoriteAdRepository;
    private final AdCommentRepository adCommentRepository;
    private final FileStorageService fileStorageService;

    public List<PendingAdResponse> getPendingAds(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(
                page != null && page > 0 ? page - 1 : 0,
                size != null && size > 0 ? size : 20,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Ad> adPage = adRepository.findByStatus(AdStatus.ON_MODERATION, pageable);

        return adPage.getContent().stream()
                .map(this::mapToPendingResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ModerationActionResponse approveAd(Long adId) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        if (ad.getStatus() != AdStatus.ON_MODERATION) {
            throw new AdStatusNotAllowedException("Можно одобрять только объявления со статусом ON_MODERATION");
        }

        ad.setStatus(AdStatus.ACTIVE);
        adRepository.save(ad);

        notificationService.sendNotificationSafe(
                ad.getUser().getId(),
                "AD_APPROVED",
                "Ваше объявление одобрено",
                "Объявление \"" + ad.getTitle() + "\" прошло модерацию и опубликовано.",
                ad.getId()
        );

        return new ModerationActionResponse(
                ad.getId(),
                ad.getStatus(),
                "Объявление успешно одобрено"
        );
    }

    @Transactional
    public ModerationActionResponse rejectAd(Long adId) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        if (ad.getStatus() != AdStatus.ON_MODERATION) {
            throw new AdStatusNotAllowedException("Можно отклонять только объявления со статусом ON_MODERATION");
        }

        ad.setStatus(AdStatus.BLOCKED);
        adRepository.save(ad);

        notificationService.sendNotificationSafe(
                ad.getUser().getId(),
                "AD_REJECTED",
                "Объявление отклонено",
                "Объявление \"" + ad.getTitle() + "\" отклонено модератором.",
                ad.getId()
        );

        return new ModerationActionResponse(
                ad.getId(),
                ad.getStatus(),
                "Объявление отклонено"
        );
    }

    @Transactional
    public ModerationActionResponse sendForRevision(Long adId) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        if (ad.getStatus() != AdStatus.ON_MODERATION) {
            throw new AdStatusNotAllowedException("Можно отправлять на доработку только объявления со статусом ON_MODERATION");
        }

        ad.setStatus(AdStatus.DRAFT);
        adRepository.save(ad);

        notificationService.sendNotificationSafe(
            ad.getUser().getId(),
            "AD_REVISION_REQUIRED",
            "Требуется доработка объявления",
            "Объявление \"" + ad.getTitle() + "\" отправлено на доработку модератором.",
            ad.getId()
        );

        return new ModerationActionResponse(
                ad.getId(),
                ad.getStatus(),
                "Объявление отправлено на доработку"
        );
    }

    @Transactional
    public ModerationActionResponse deleteAd(Long adId) {
        log.info("Начало удаления объявления модератором: adId={}", adId);
        
        // Загружаем объявление со всеми медиафайлами
        Ad ad = adRepository.findByIdWithMediaFiles(adId)
                .orElseThrow(() -> {
                    log.error("Объявление не найдено: adId={}", adId);
                    return new AdNotFoundException(adId);
                });

        if (ad.getStatus() != AdStatus.ON_MODERATION) {
            throw new AdStatusNotAllowedException("Можно удалять только объявления со статусом ON_MODERATION");
        }

        // 1. Удаляем все медиафайлы из MinIO и из БД
        List<AdMedia> mediaFiles = adMediaRepository.findByAdId(adId);
        log.info("Найдено медиафайлов для удаления: {}", mediaFiles.size());
        
        for (AdMedia media : mediaFiles) {
            try {
                if (media.getFileUrl() != null && !media.getFileUrl().isEmpty()) {
                    // Извлекаем путь из presigned URL для удаления из MinIO
                    String filePath = extractFilePathFromUrl(media.getFileUrl());
                    if (filePath != null) {
                        fileStorageService.deleteFile(filePath);
                        log.info("Медиафайл удален из MinIO: {}", filePath);
                    } else {
                        log.warn("Не удалось извлечь путь из URL для удаления: {}", media.getFileUrl());
                    }
                }
            } catch (Exception e) {
                log.error("Ошибка при удалении медиафайла из MinIO (продолжаем): {}", e.getMessage(), e);
                // Продолжаем удаление даже если не удалось удалить файл из MinIO
            }
        }
        
        // Удаляем записи медиафайлов из БД
        adMediaRepository.deleteByAdId(adId);
        log.info("Медиафайлы удалены из БД для объявления: adId={}", adId);
        
        // 2. Удаляем все записи из избранного
        favoriteAdRepository.deleteByAdId(adId);
        log.info("Записи из избранного удалены для объявления: adId={}", adId);
        
        // 3. Деактивируем все комментарии
        adCommentRepository.deactivateAllCommentsByAdId(adId);
        log.info("Комментарии деактивированы для объявления: adId={}", adId);
        
        // 4. Перезагружаем объявление из БД, чтобы Hibernate обновил состояние коллекций
        // Это необходимо, чтобы избежать конфликтов при сохранении после удаления связанных сущностей
        ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));
        
        // 5. Помечаем объявление как удаленное
        ad.setStatus(AdStatus.DELETED);
        adRepository.save(ad);
        log.info("Объявление помечено как удаленное: adId={}", adId);
        
        // 5. Отправляем уведомление пользователю
        notificationService.sendNotificationSafe(
                ad.getUser().getId(),
                "AD_DELETED",
                "Объявление удалено",
                "Объявление \"" + ad.getTitle() + "\" было удалено модератором.",
                ad.getId()
        );
        log.info("Уведомление отправлено пользователю (safe): userId={}", ad.getUser().getId());
        
        log.info("Удаление объявления модератором завершено успешно: adId={}", adId);
        
        return new ModerationActionResponse(
                ad.getId(),
                ad.getStatus(),
                "Объявление удалено"
        );
    }
    
    /**
     * Извлекает путь к файлу из presigned URL для удаления из MinIO
     */
    private String extractFilePathFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        try {
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

    private PendingAdResponse mapToPendingResponse(Ad ad) {
        List<com.bsuir.adhubbackand.model.dto.response.AdMediaResponse> mediaFiles = ad.getMediaFiles() != null
                ? ad.getMediaFiles().stream()
                        .map(media -> new com.bsuir.adhubbackand.model.dto.response.AdMediaResponse(
                                media.getId(),
                                media.getFileUrl(),
                                media.getFileType() != null ? media.getFileType().name() : null,
                                media.getIsPrimary(),
                                media.getDisplayOrder()
                        ))
                        .collect(java.util.stream.Collectors.toList())
                : java.util.Collections.emptyList();

        return new PendingAdResponse(
                ad.getId(),
                ad.getTitle(),
                ad.getDescription(),
                ad.getPrice(),
                ad.getCurrency(),
                ad.getLocation(),
                ad.getStatus(),
                ad.getUser().getId(),
                ad.getUser().getUsername(),
                ad.getUser().getEmail(),
                ad.getCategory().getId(),
                ad.getCategory().getName(),
                ad.getViewCount(),
                mediaFiles,
                ad.getCreatedAt(),
                ad.getUpdatedAt()
        );
    }
}

