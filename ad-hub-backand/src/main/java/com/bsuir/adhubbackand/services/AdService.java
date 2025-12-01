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
import com.bsuir.adhubbackand.model.entities.SearchHistory;
import com.bsuir.adhubbackand.repositories.AdRepository;
import com.bsuir.adhubbackand.repositories.CategoryRepository;
import com.bsuir.adhubbackand.repositories.SearchHistoryRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdService {

    private final AdRepository adRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    
    // ThreadLocal для отслеживания уже залогированных запросов в рамках одного HTTP-запроса
    private static final ThreadLocal<java.util.Set<String>> loggedQueries = new ThreadLocal<java.util.Set<String>>() {
        @Override
        protected java.util.Set<String> initialValue() {
            return new java.util.HashSet<>();
        }
    };

    @Transactional
    public AdResponse createAd(Long userId, CreateAdRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new CategoryNotFoundException(request.categoryId()));

        // Определяем статус: если передан в запросе - используем его, иначе ON_MODERATION
        AdStatus status = request.status() != null ? request.status() : AdStatus.ON_MODERATION;

        // Для черновика описание может быть пустым, для публикации - обязательно
        String description = request.description();
        if (description == null || description.trim().isEmpty()) {
            if (status == AdStatus.DRAFT) {
                description = "Черновик";
            } else {
                throw new IllegalArgumentException("Описание обязательно для публикации объявления");
            }
        }

        Ad ad = Ad.builder()
                .title(request.title())
                .description(description)
                .price(request.price() != null ? request.price() : BigDecimal.ZERO)
                .currency(request.currency() != null ? request.currency() : "BYN")
                .location(request.location())
                .status(status)
                .user(user)
                .category(category)
                .viewCount(0)
                .build();

        Ad savedAd = adRepository.save(ad);
        log.info("Объявление создано: ID={}, пользователь={}, статус={}", savedAd.getId(), user.getEmail(), status);

        // Инициализируем lazy коллекции и связи в рамках транзакции
        savedAd.getMediaFiles().size(); // Принудительная инициализация lazy коллекции
        savedAd.getUser().getUsername(); // Принудительная инициализация lazy связи User
        savedAd.getCategory().getName(); // Принудительная инициализация lazy связи Category

        return mapToResponse(savedAd);
    }

    @Transactional(readOnly = true)
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

        // Инициализируем lazy коллекции и связи в рамках транзакции
        List<Ad> ads = adPage.getContent();
        for (Ad ad : ads) {
            ad.getMediaFiles().size(); // Принудительная инициализация lazy коллекции
            ad.getUser().getUsername(); // Принудительная инициализация lazy связи User
            ad.getCategory().getName(); // Принудительная инициализация lazy связи Category
        }

        List<AdResponse> content = ads.stream()
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
    public AdResponse getAdById(Long adId, Long currentUserId) {
        // Загружаем Ad с mediaFiles, User и Category используя JOIN FETCH для избежания LazyInitializationException
        Ad ad = adRepository.findByIdWithMediaFiles(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        // Увеличиваем счетчик просмотров только если это не владелец объявления
        if (currentUserId == null || !ad.getUser().getId().equals(currentUserId)) {
        adRepository.incrementViewCount(adId);
        }

        // Инициализируем lazy коллекции и связи в рамках транзакции
        ad.getMediaFiles().size(); // Принудительная инициализация lazy коллекции
        ad.getUser().getUsername(); // Принудительная инициализация lazy связи User
        ad.getCategory().getName(); // Принудительная инициализация lazy связи Category

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

        // Инициализируем lazy коллекции и связи в рамках транзакции
        List<Ad> ads = adPage.getContent();
        for (Ad ad : ads) {
            ad.getMediaFiles().size(); // Принудительная инициализация lazy коллекции
            ad.getUser().getUsername(); // Принудительная инициализация lazy связи User
            ad.getCategory().getName(); // Принудительная инициализация lazy связи Category
        }

        List<AdResponse> content = ads.stream()
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
    public AdListResponse searchAds(
            String searchQuery,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String location,
            SortBy sortBy,
            Integer page,
            Integer size,
            Long userId
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

        // Логируем поисковый запрос в историю (только если есть текстовый запрос)
        // Используем ThreadLocal для предотвращения двойного сохранения в рамках одного HTTP-запроса
        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            try {
                // Формируем текст запроса с фильтрами
                StringBuilder queryTextBuilder = new StringBuilder(searchQuery.trim());
                if (categoryId != null) {
                    queryTextBuilder.append(" [категория:").append(categoryId).append("]");
                }
                if (minPrice != null || maxPrice != null) {
                    queryTextBuilder.append(" [цена:");
                    if (minPrice != null) queryTextBuilder.append(minPrice);
                    queryTextBuilder.append("-");
                    if (maxPrice != null) queryTextBuilder.append(maxPrice);
                    queryTextBuilder.append("]");
                }
                if (location != null && !location.trim().isEmpty()) {
                    queryTextBuilder.append(" [локация:").append(location.trim()).append("]");
                }
                
                String fullQueryText = queryTextBuilder.toString();
                if (fullQueryText.length() > 1000) {
                    fullQueryText = fullQueryText.substring(0, 1000);
                }
                
                // Создаем уникальный ключ для запроса (текст + userId)
                // ThreadLocal предотвратит двойное сохранение в рамках одного HTTP-запроса
                String queryKey = fullQueryText + "|" + (userId != null ? userId : "null");
                
                // Проверяем, не был ли уже залогирован этот запрос в рамках текущего HTTP-запроса
                java.util.Set<String> logged = loggedQueries.get();
                if (!logged.contains(queryKey)) {
                    // Помечаем запрос как залогированный
                    logged.add(queryKey);
                    
                    // Дополнительная проверка: не сохраняем дубликаты за последнюю минуту
                    java.time.LocalDateTime oneMinuteAgo = java.time.LocalDateTime.now().minusMinutes(1);
                    long recentDuplicates = searchHistoryRepository.countRecentDuplicates(
                            fullQueryText, 
                            oneMinuteAgo, 
                            userId
                    );
                    
                    if (recentDuplicates == 0) {
                        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
                        
                        SearchHistory searchHistory = SearchHistory.builder()
                                .user(user)
                                .queryText(fullQueryText)
                                .resultsCount((int) adPage.getTotalElements())
                                .build();
                        
                        searchHistoryRepository.save(searchHistory);
                        log.debug("Поисковый запрос сохранен в историю: query={}, userId={}, results={}", 
                                fullQueryText, userId, adPage.getTotalElements());
                    } else {
                        log.debug("Поисковый запрос не сохранен (дубликат за последнюю минуту): query={}, userId={}", 
                                fullQueryText, userId);
                    }
                } else {
                    log.debug("Поисковый запрос не сохранен (уже залогирован в этом запросе): query={}, userId={}", 
                            fullQueryText, userId);
                }
            } catch (Exception e) {
                // Логируем ошибку, но не прерываем выполнение поиска
                log.warn("Не удалось сохранить поисковый запрос в историю: {}", e.getMessage());
            }
        }

        // Инициализируем lazy коллекции и связи в рамках транзакции
        List<Ad> ads = adPage.getContent();
        for (Ad ad : ads) {
            ad.getMediaFiles().size(); // Принудительная инициализация lazy коллекции
            ad.getUser().getUsername(); // Принудительная инициализация lazy связи User
            ad.getCategory().getName(); // Принудительная инициализация lazy связи Category
        }

        List<AdResponse> content = ads.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        // Очищаем ThreadLocal после завершения обработки запроса
        // Это предотвратит утечку памяти и позволит следующему запросу начать с чистого листа
        try {
            loggedQueries.remove();
        } catch (Exception e) {
            log.warn("Ошибка при очистке ThreadLocal: {}", e.getMessage());
        }

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
        // Загружаем Ad с User и Category используя JOIN FETCH для избежания LazyInitializationException
        Ad ad = adRepository.findByIdWithMediaFiles(adId)
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

        // Обновляем статус, если он передан в запросе
        if (request.status() != null) {
            ad.setStatus(request.status());
            log.info("Статус объявления изменен на: {}", request.status());
        } else {
            // Если статус не передан, применяем логику по умолчанию:
            // При обновлении активного или на модерации объявления - отправляем на повторную модерацию
            if (ad.getStatus() == AdStatus.ON_MODERATION || ad.getStatus() == AdStatus.ACTIVE) {
                ad.setStatus(AdStatus.ON_MODERATION);
            }
            // Для черновика статус не меняется, если не указан явно
        }

        Ad updatedAd = adRepository.save(ad);
        log.info("Объявление обновлено: ID={}", updatedAd.getId());

        // Инициализируем lazy коллекции и связи в рамках транзакции
        updatedAd.getMediaFiles().size(); // Принудительная инициализация lazy коллекции
        updatedAd.getUser().getUsername(); // Принудительная инициализация lazy связи User
        updatedAd.getCategory().getName(); // Принудительная инициализация lazy связи Category

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

    @Transactional
    public AdResponse saveAsDraft(Long adId, Long userId) {
        Ad ad = adRepository.findByIdWithMediaFiles(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        // Проверяем, что пользователь является владельцем объявления
        if (!ad.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Нет доступа к изменению этого объявления");
        }

        ad.setStatus(AdStatus.DRAFT);
        Ad savedAd = adRepository.save(ad);
        log.info("Объявление сохранено как черновик: ID={}", adId);

        // Инициализируем lazy коллекции и связи в рамках транзакции
        savedAd.getMediaFiles().size();
        savedAd.getUser().getUsername();
        savedAd.getCategory().getName();

        return mapToResponse(savedAd);
    }

    @Transactional
    public AdResponse archiveAd(Long adId, Long userId) {
        try {
            log.info("Начало архивирования объявления: adId={}, userId={}", adId, userId);
            
            // Загружаем объявление со всеми необходимыми связями
            Ad ad = adRepository.findByIdWithMediaFiles(adId)
                    .orElseThrow(() -> {
                        log.error("Объявление не найдено: adId={}", adId);
                        return new AdNotFoundException(adId);
                    });

            log.debug("Объявление загружено: adId={}, status={}, userId={}", adId, ad.getStatus(), ad.getUser() != null ? ad.getUser().getId() : "null");

            // Проверяем, что пользователь является владельцем объявления
            if (ad.getUser() == null) {
                log.error("User is null for ad ID: {}", adId);
                throw new IllegalStateException("Пользователь не найден для объявления ID: " + adId);
            }
            
            if (!ad.getUser().getId().equals(userId)) {
                log.warn("Попытка архивирования чужого объявления: adId={}, ownerId={}, userId={}", 
                        adId, ad.getUser().getId(), userId);
                throw new AccessDeniedException("Нет доступа к архивированию этого объявления");
            }

            // Проверяем, что объявление можно архивировать
            if (ad.getStatus() == AdStatus.DELETED) {
                log.warn("Попытка архивировать удаленное объявление: adId={}", adId);
                throw new AdStatusNotAllowedException("Нельзя архивировать удаленное объявление");
            }

            // Если объявление уже в архиве, просто возвращаем его
            if (ad.getStatus() == AdStatus.ARCHIVED) {
                log.info("Объявление уже в архиве: ID={}", adId);
                // Инициализируем lazy коллекции и связи в рамках транзакции
                if (ad.getMediaFiles() != null) {
                    ad.getMediaFiles().size();
                }
                if (ad.getUser() != null) {
                    ad.getUser().getUsername();
                    ad.getUser().getEmail();
                    ad.getUser().getPhone();
                    ad.getUser().getAvatarUrl();
                    ad.getUser().getFirstName();
                    ad.getUser().getLastName();
                }
                if (ad.getCategory() != null) {
                    ad.getCategory().getName();
                }
                return mapToResponse(ad);
            }

            // Сохраняем статус архива
            ad.setStatus(AdStatus.ARCHIVED);
            adRepository.save(ad);
            log.info("Объявление отправлено в архив: ID={}", adId);

            // Перезагружаем объявление со всеми связями после сохранения
            // Это необходимо, так как после save() объект может быть отсоединен от сессии
            Ad reloadedAd = adRepository.findByIdWithMediaFiles(adId)
                    .orElseThrow(() -> {
                        log.error("Не удалось перезагрузить объявление после сохранения: adId={}", adId);
                        return new AdNotFoundException(adId);
                    });

            // Инициализируем все lazy коллекции и связи в рамках транзакции
            if (reloadedAd.getMediaFiles() != null) {
                reloadedAd.getMediaFiles().size();
            }
            if (reloadedAd.getUser() != null) {
                reloadedAd.getUser().getUsername();
                reloadedAd.getUser().getEmail();
                reloadedAd.getUser().getPhone();
                reloadedAd.getUser().getAvatarUrl();
                reloadedAd.getUser().getFirstName();
                reloadedAd.getUser().getLastName();
            }
            if (reloadedAd.getCategory() != null) {
                reloadedAd.getCategory().getName();
            }

            log.info("Успешное архивирование объявления: adId={}", adId);
            return mapToResponse(reloadedAd);
        } catch (AdNotFoundException | AccessDeniedException | AdStatusNotAllowedException e) {
            // Перебрасываем известные исключения
            throw e;
        } catch (Exception e) {
            log.error("Неожиданная ошибка при архивировании объявления adId={}, userId={}: {}", 
                    adId, userId, e.getMessage(), e);
            throw new RuntimeException("Ошибка при архивировании объявления: " + e.getMessage(), e);
        }
    }

    @Transactional
    public AdResponse publishAd(Long adId, Long userId) {
        try {
            log.info("Начало публикации объявления из архива: adId={}, userId={}", adId, userId);
            
            // Загружаем объявление со всеми необходимыми связями
            Ad ad = adRepository.findByIdWithMediaFiles(adId)
                    .orElseThrow(() -> {
                        log.error("Объявление не найдено: adId={}", adId);
                        return new AdNotFoundException(adId);
                    });

            log.debug("Объявление загружено: adId={}, status={}, userId={}", adId, ad.getStatus(), ad.getUser() != null ? ad.getUser().getId() : "null");

            // Проверяем, что пользователь является владельцем объявления
            if (ad.getUser() == null) {
                log.error("User is null for ad ID: {}", adId);
                throw new IllegalStateException("Пользователь не найден для объявления ID: " + adId);
            }
            
            if (!ad.getUser().getId().equals(userId)) {
                log.warn("Попытка публикации чужого объявления: adId={}, ownerId={}, userId={}", 
                        adId, ad.getUser().getId(), userId);
                throw new AccessDeniedException("Нет доступа к публикации этого объявления");
            }

            // Проверяем, что объявление можно опубликовать (должно быть в архиве)
            if (ad.getStatus() != AdStatus.ARCHIVED) {
                log.warn("Попытка опубликовать неархивное объявление: adId={}, status={}", adId, ad.getStatus());
                throw new AdStatusNotAllowedException("Можно опубликовать только архивные объявления");
            }

            // При публикации из архива отправляем на модерацию
            ad.setStatus(AdStatus.ON_MODERATION);
            adRepository.save(ad);
            log.info("Объявление опубликовано из архива: ID={}", adId);

            // Перезагружаем объявление со всеми связями после сохранения
            Ad reloadedAd = adRepository.findByIdWithMediaFiles(adId)
                    .orElseThrow(() -> {
                        log.error("Не удалось перезагрузить объявление после сохранения: adId={}", adId);
                        return new AdNotFoundException(adId);
                    });

            // Инициализируем все lazy коллекции и связи в рамках транзакции
            if (reloadedAd.getMediaFiles() != null) {
                reloadedAd.getMediaFiles().size();
            }
            if (reloadedAd.getUser() != null) {
                reloadedAd.getUser().getUsername();
                reloadedAd.getUser().getEmail();
                reloadedAd.getUser().getPhone();
                reloadedAd.getUser().getAvatarUrl();
                reloadedAd.getUser().getFirstName();
                reloadedAd.getUser().getLastName();
            }
            if (reloadedAd.getCategory() != null) {
                reloadedAd.getCategory().getName();
            }

            log.info("Успешная публикация объявления из архива: adId={}", adId);
            return mapToResponse(reloadedAd);
        } catch (AdNotFoundException | AccessDeniedException | AdStatusNotAllowedException e) {
            // Перебрасываем известные исключения
            throw e;
        } catch (Exception e) {
            log.error("Неожиданная ошибка при публикации объявления adId={}, userId={}: {}", 
                    adId, userId, e.getMessage(), e);
            throw new RuntimeException("Ошибка при публикации объявления: " + e.getMessage(), e);
        }
    }

    private AdResponse mapToResponse(Ad ad) {
        try {
            // Безопасная обработка mediaFiles
            List<AdResponse.MediaItem> mediaItems = (ad.getMediaFiles() != null) 
                    ? ad.getMediaFiles().stream()
                            .map(media -> new AdResponse.MediaItem(
                                    media.getId(),
                                    media.getFileUrl(),
                                    media.getFileType().name(),
                                    media.getIsPrimary(),
                                    media.getDisplayOrder()
                            ))
                            .collect(Collectors.toList())
                    : new ArrayList<>();

            // Проверяем наличие User и Category
            if (ad.getUser() == null) {
                log.error("User is null for ad ID: {}", ad.getId());
                throw new IllegalStateException("User не найден для объявления ID: " + ad.getId());
            }
            if (ad.getCategory() == null) {
                log.error("Category is null for ad ID: {}", ad.getId());
                throw new IllegalStateException("Категория не найдена для объявления ID: " + ad.getId());
            }

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
                    ad.getUser().getEmail(),
                    ad.getUser().getPhone(),
                    ad.getUser().getAvatarUrl(),
                    ad.getUser().getFirstName(),
                    ad.getUser().getLastName(),
                    ad.getCategory().getId(),
                    ad.getCategory().getName(),
                    ad.getViewCount(),
                    mediaItems,
                    ad.getCreatedAt(),
                    ad.getUpdatedAt()
            );
        } catch (Exception e) {
            log.error("Ошибка при маппинге объявления ID {} в AdResponse: {}", ad.getId(), e.getMessage(), e);
            throw new RuntimeException("Ошибка при формировании ответа для объявления ID: " + ad.getId(), e);
        }
    }
}

