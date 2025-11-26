package com.bsuir.adhubbackand.controllers;

import com.bsuir.adhubbackand.model.dto.request.user.UserRatingRequest;
import com.bsuir.adhubbackand.model.dto.response.UserRatingsResponse;
import com.bsuir.adhubbackand.security.UserDetailsImpl;
import com.bsuir.adhubbackand.services.UserRatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserRatingController {

    private final UserRatingService userRatingService;

    @PostMapping("/{userId}/ratings")
    public ResponseEntity<Void> rateUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UserRatingRequest request) {
        userRatingService.rateUser(userId, userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{userId}/ratings")
    public ResponseEntity<UserRatingsResponse> getUserRatings(@PathVariable Long userId) {
        UserRatingsResponse ratings = userRatingService.getUserRatingsWithStats(userId);
        return ResponseEntity.ok(ratings);
    }

    @GetMapping("/me/ratings")
    public ResponseEntity<List<UserRatingsResponse.RatingItem>> getMyRatings(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<UserRatingsResponse.RatingItem> ratings = userRatingService.getMyRatings(userDetails.getId());
        return ResponseEntity.ok(ratings);
    }
}