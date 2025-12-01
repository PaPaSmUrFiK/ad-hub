package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.AdNotFoundException;
import com.bsuir.adhubbackand.exception.AdStatusNotAllowedException;
import com.bsuir.adhubbackand.model.dto.response.admin.ModerationActionResponse;
import com.bsuir.adhubbackand.model.dto.response.admin.PendingAdResponse;
import com.bsuir.adhubbackand.model.entities.Ad;
import com.bsuir.adhubbackand.model.enums.AdStatus;
import com.bsuir.adhubbackand.repositories.AdRepository;
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

        log.info("Объявление одобрено: adId={}", adId);

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

        log.info("Объявление отклонено: adId={}", adId);

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

        log.info("Объявление отправлено на доработку: adId={}", adId);

        return new ModerationActionResponse(
                ad.getId(),
                ad.getStatus(),
                "Объявление отправлено на доработку"
        );
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

