package com.bsuir.adhubbackand.controllers;

import com.bsuir.adhubbackand.model.dto.request.ad.CreateAdRequest;
import com.bsuir.adhubbackand.model.dto.request.ad.UpdateAdRequest;
import com.bsuir.adhubbackand.model.dto.response.AdListResponse;
import com.bsuir.adhubbackand.model.dto.response.AdMediaResponse;
import com.bsuir.adhubbackand.model.dto.response.AdResponse;
import com.bsuir.adhubbackand.model.enums.AdStatus;
import com.bsuir.adhubbackand.model.enums.SortBy;
import com.bsuir.adhubbackand.security.UserDetailsImpl;
import com.bsuir.adhubbackand.services.AdMediaService;
import com.bsuir.adhubbackand.services.AdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/ads")
@RequiredArgsConstructor
public class AdController {

    private final AdService adService;
    private final AdMediaService adMediaService;

    @PostMapping
    public ResponseEntity<AdResponse> createAd(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateAdRequest request) {
        AdResponse ad = adService.createAd(userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ad);
    }

    @GetMapping
    public ResponseEntity<AdListResponse> getAds(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AdStatus status
    ) {
        AdListResponse ads = adService.getAds(page, size, categoryId, minPrice, maxPrice, location, search, status);
        return ResponseEntity.ok(ads);
    }

    @GetMapping("/search")
    public ResponseEntity<AdListResponse> searchAds(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) SortBy sortBy,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        AdListResponse ads = adService.searchAds(query, categoryId, minPrice, maxPrice, location, sortBy, page, size);
        return ResponseEntity.ok(ads);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<AdListResponse> getAdsByUserId(
            @PathVariable Long userId,
            @RequestParam(required = false) AdStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        AdListResponse ads = adService.getAdsByUserId(userId, status, page, size);
        return ResponseEntity.ok(ads);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdResponse> getAdById(@PathVariable Long id) {
        AdResponse ad = adService.getAdById(id);
        return ResponseEntity.ok(ad);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdResponse> updateAd(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateAdRequest request) {
        AdResponse ad = adService.updateAd(id, userDetails.getId(), request);
        return ResponseEntity.ok(ad);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAd(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        adService.deleteAd(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/media")
    public ResponseEntity<AdMediaResponse> uploadMedia(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        AdMediaResponse media = adMediaService.uploadMedia(id, userDetails.getId(), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(media);
    }

    @DeleteMapping("/{id}/media/{mediaId}")
    public ResponseEntity<Void> deleteMedia(
            @PathVariable Long id,
            @PathVariable Long mediaId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        adMediaService.deleteMedia(id, mediaId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}

