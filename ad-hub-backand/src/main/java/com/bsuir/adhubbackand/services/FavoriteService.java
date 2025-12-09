package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.AdNotFoundException;
import com.bsuir.adhubbackand.exception.UserNotFoundException;
import com.bsuir.adhubbackand.model.dto.response.AdResponse;
import com.bsuir.adhubbackand.model.dto.response.FavoriteListResponse;
import com.bsuir.adhubbackand.model.dto.response.FavoriteResponse;
import com.bsuir.adhubbackand.model.entities.Ad;
import com.bsuir.adhubbackand.model.entities.FavoriteAd;
import com.bsuir.adhubbackand.model.enums.AdStatus;
import com.bsuir.adhubbackand.repositories.AdRepository;
import com.bsuir.adhubbackand.repositories.FavoriteAdRepository;
import com.bsuir.adhubbackand.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteAdRepository favoriteAdRepository;
    private final AdRepository adRepository;
    private final UserRepository userRepository;

    @Transactional
    public void addToFavorites(Long adId, Long userId) {
        // Проверяем наличие объявления и пользователя
        adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Используем ON CONFLICT DO NOTHING на уровне SQL, чтобы избежать дубликатов и rollback
        int inserted = favoriteAdRepository.insertIfNotExists(userId, adId);
        if (inserted > 0) {
            log.info("Объявление добавлено в избранное: adId={}, userId={}", adId, userId);
        } else {
            log.info("Объявление уже в избранном (no-op): adId={}, userId={}", adId, userId);
        }
    }

    @Transactional
    public void removeFromFavorites(Long adId, Long userId) {
        // Используем прямой SQL запрос для удаления, чтобы избежать оптимистической блокировки
        // при одновременных запросах
        int deletedCount = favoriteAdRepository.deleteByUserIdAndAdId(userId, adId);
        
        if (deletedCount > 0) {
            log.info("Объявление удалено из избранного: adId={}, userId={}", adId, userId);
        } else {
            log.info("Объявление уже удалено из избранного: adId={}, userId={}", adId, userId);
        }
    }

    public FavoriteListResponse getUserFavorites(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }

        List<FavoriteAd> favorites = favoriteAdRepository.findByUserId(userId);

        List<FavoriteResponse> favoriteResponses = favorites.stream()
                .filter(favorite -> favorite.getAd().getStatus() != AdStatus.DELETED) // Исключаем удаленные объявления
                .map(favorite -> {
                    Ad ad = favorite.getAd();
                    
                    // Получаем основное изображение
                    AdResponse.MediaItem primaryImage = null;
                    if (!ad.getMediaFiles().isEmpty()) {
                        var primaryMedia = ad.getMediaFiles().stream()
                                .filter(media -> Boolean.TRUE.equals(media.getIsPrimary()))
                                .findFirst()
                                .orElse(ad.getMediaFiles().get(0));
                        
                        primaryImage = new AdResponse.MediaItem(
                                primaryMedia.getId(),
                                primaryMedia.getFileUrl(),
                                primaryMedia.getFileType().name(),
                                primaryMedia.getIsPrimary(),
                                primaryMedia.getDisplayOrder()
                        );
                    }

                    return new FavoriteResponse(
                            favorite.getId(),
                            ad.getId(),
                            ad.getTitle(),
                            ad.getDescription(),
                            primaryImage,
                            favorite.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());

        return new FavoriteListResponse(favoriteResponses, favoriteResponses.size());
    }
}

