package com.bsuir.adhubbackand.controllers;

import com.bsuir.adhubbackand.model.dto.response.FavoriteListResponse;
import com.bsuir.adhubbackand.security.UserDetailsImpl;
import com.bsuir.adhubbackand.services.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ads")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping("/favorites")
    public ResponseEntity<FavoriteListResponse> getUserFavorites(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        FavoriteListResponse favorites = favoriteService.getUserFavorites(userDetails.getId());
        return ResponseEntity.ok(favorites);
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<Void> addToFavorites(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        favoriteService.addToFavorites(id, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/favorite")
    public ResponseEntity<Void> removeFromFavorites(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        favoriteService.removeFromFavorites(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}

