package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.AdNotFoundException;
import com.bsuir.adhubbackand.exception.AdStatusNotAllowedException;
import com.bsuir.adhubbackand.exception.AccessDeniedException;
import com.bsuir.adhubbackand.exception.CategoryNotFoundException;
import com.bsuir.adhubbackand.exception.UserNotFoundException;
import com.bsuir.adhubbackand.model.dto.request.ad.CreateAdRequest;
import com.bsuir.adhubbackand.model.dto.request.ad.UpdateAdRequest;
import com.bsuir.adhubbackand.model.dto.response.AdListResponse;
import com.bsuir.adhubbackand.model.dto.response.AdResponse;
import com.bsuir.adhubbackand.model.entities.Ad;
import com.bsuir.adhubbackand.model.entities.Category;
import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.model.enums.AdStatus;
import com.bsuir.adhubbackand.model.enums.SortBy;
import com.bsuir.adhubbackand.repositories.AdRepository;
import com.bsuir.adhubbackand.repositories.CategoryRepository;
import com.bsuir.adhubbackand.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdService {

    private final AdRepository adRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public AdResponse createAd(Long userId, CreateAdRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new CategoryNotFoundException(request.categoryId()));

        Ad ad = Ad.builder()
                .title(request.title())
                .description(request.description())
                .price(request.price() != null ? request.price() : BigDecimal.ZERO)
                .currency(request.currency() != null ? request.currency() : "BYN")
                .location(request.location())
                .status(AdStatus.ON_MODERATION) // Новые объявления отправляются на модерацию
                .user(user)
                .category(category)
                .viewCount(0)
                .build();

        Ad savedAd = adRepository.save(ad);
        log.info("Объявление создано: ID={}, пользователь={}", savedAd.getId(), user.getEmail());

        return mapToResponse(savedAd);
    }

    public AdListResponse getAds(
            Integer page,
            Integer size,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String location,
            String searchQuery,
            AdStatus status
    ) {
        Pageable pageable = PageRequest.of(
                page != null && page > 0 ? page - 1 : 0,
                size != null && size > 0 ? size : 20,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Ad> adPage;

        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            if (categoryId != null) {
                adPage = adRepository.searchActiveAdsByCategory(searchQuery.trim(), categoryId, pageable);
            } else {
                adPage = adRepository.searchActiveAds(searchQuery.trim(), pageable);
            }
        } else if (categoryId != null) {
            adPage = adRepository.findByCategoryId(categoryId, pageable);
        } else if (location != null && !location.trim().isEmpty()) {
            adPage = adRepository.findActiveAdsByLocation(location.trim(), pageable);
        } else if (minPrice != null || maxPrice != null) {
            BigDecimal min = minPrice != null ? minPrice : BigDecimal.ZERO;
            BigDecimal max = maxPrice != null ? maxPrice : BigDecimal.valueOf(Long.MAX_VALUE);
            List<Ad> ads = adRepository.findActiveAdsByPriceRange(min, max);
            // Простая пагинация для списка
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), ads.size());
            List<Ad> pagedAds = ads.subList(Math.min(start, ads.size()), end);
            adPage = new org.springframework.data.domain.PageImpl<>(pagedAds, pageable, ads.size());
        } else if (status != null) {
            adPage = adRepository.findByStatus(status, pageable);
        } else {
            adPage = adRepository.findByStatus(AdStatus.ACTIVE, pageable);
        }

        List<AdResponse> content = adPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new AdListResponse(
                content,
                adPage.getNumber() + 1,
                adPage.getSize(),
                adPage.getTotalElements(),
                adPage.getTotalPages(),
                adPage.hasNext(),
                adPage.hasPrevious()
        );
    }

    public AdResponse getAdById(Long adId) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        // Увеличиваем счетчик просмотров
        adRepository.incrementViewCount(adId);

        return mapToResponse(ad);
    }

    @Transactional(readOnly = true)
    public AdListResponse getAdsByUserId(
            Long userId,
            AdStatus status,
            Integer page,
            Integer size
    ) {
        // Проверяем существование пользователя
        if (!userRepository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }

        Pageable pageable = PageRequest.of(
                page != null && page > 0 ? page - 1 : 0,
                size != null && size > 0 ? size : 20,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Ad> adPage;
        if (status != null) {
            adPage = adRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            adPage = adRepository.findByUserId(userId, pageable);
        }

        List<AdResponse> content = adPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new AdListResponse(
                content,
                adPage.getNumber() + 1,
                adPage.getSize(),
                adPage.getTotalElements(),
                adPage.getTotalPages(),
                adPage.hasNext(),
                adPage.hasPrevious()
        );
    }

    @Transactional(readOnly = true)
    public AdListResponse searchAds(
            String searchQuery,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String location,
            SortBy sortBy,
            Integer page,
            Integer size
    ) {
        // Настройка пагинации
        int pageNumber = page != null && page > 0 ? page - 1 : 0;
        int pageSize = size != null && size > 0 ? size : 20;

        // Настройка сортировки
        Sort sort;
        if (sortBy != null) {
            Sort.Direction direction = "ASC".equals(sortBy.getDirection()) 
                    ? Sort.Direction.ASC 
                    : Sort.Direction.DESC;
            sort = Sort.by(direction, sortBy.getField());
        } else {
            // По умолчанию сортировка по дате создания (новые сначала)
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        // Поиск с фильтрами
        Page<Ad> adPage = adRepository.searchAdsWithFilters(
                searchQuery,
                categoryId,
                minPrice,
                maxPrice,
                location,
                pageable
        );

        List<AdResponse> content = adPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new AdListResponse(
                content,
                adPage.getNumber() + 1,
                adPage.getSize(),
                adPage.getTotalElements(),
                adPage.getTotalPages(),
                adPage.hasNext(),
                adPage.hasPrevious()
        );
    }

    @Transactional
    public AdResponse updateAd(Long adId, Long userId, UpdateAdRequest request) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        // Проверяем, что пользователь является владельцем объявления
        if (!ad.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Нет доступа к редактированию этого объявления");
        }

        // Проверяем, что объявление можно редактировать
        if (ad.getStatus() == AdStatus.DELETED) {
            throw new AdStatusNotAllowedException("Нельзя редактировать удаленное объявление");
        }

        if (request.title() != null) {
            ad.setTitle(request.title());
        }
        if (request.description() != null) {
            ad.setDescription(request.description());
        }
        if (request.price() != null) {
            ad.setPrice(request.price());
        }
        if (request.currency() != null) {
            ad.setCurrency(request.currency());
        }
        if (request.location() != null) {
            ad.setLocation(request.location());
        }
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new CategoryNotFoundException(request.categoryId()));
            ad.setCategory(category);
        }

        // При обновлении меняем статус на ON_MODERATION для повторной модерации
        if (ad.getStatus() == AdStatus.ON_MODERATION || ad.getStatus() == AdStatus.ACTIVE) {
            ad.setStatus(AdStatus.ON_MODERATION);
        }

        Ad updatedAd = adRepository.save(ad);
        log.info("Объявление обновлено: ID={}", updatedAd.getId());

        return mapToResponse(updatedAd);
    }

    @Transactional
    public void deleteAd(Long adId, Long userId) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        // Проверяем, что пользователь является владельцем объявления
        if (!ad.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Нет доступа к удалению этого объявления");
        }

        ad.setStatus(AdStatus.DELETED);
        adRepository.save(ad);
        log.info("Объявление удалено: ID={}", adId);
    }

    private AdResponse mapToResponse(Ad ad) {
        List<AdResponse.MediaItem> mediaItems = ad.getMediaFiles().stream()
                .map(media -> new AdResponse.MediaItem(
                        media.getId(),
                        media.getFileUrl(),
                        media.getFileType().name(),
                        media.getIsPrimary(),
                        media.getDisplayOrder()
                ))
                .collect(Collectors.toList());

        return new AdResponse(
                ad.getId(),
                ad.getTitle(),
                ad.getDescription(),
                ad.getPrice(),
                ad.getCurrency(),
                ad.getLocation(),
                ad.getStatus(),
                ad.getUser().getId(),
                ad.getUser().getUsername(),
                ad.getCategory().getId(),
                ad.getCategory().getName(),
                ad.getViewCount(),
                mediaItems,
                ad.getCreatedAt(),
                ad.getUpdatedAt()
        );
    }
}

