package com.bsuir.adhubbackand.controllers;

import com.bsuir.adhubbackand.model.dto.request.user.ChangePasswordRequest;
import com.bsuir.adhubbackand.model.dto.request.user.UpdateProfileRequest;
import com.bsuir.adhubbackand.model.dto.response.FavoriteListResponse;
import com.bsuir.adhubbackand.model.dto.response.UserMeResponse;
import com.bsuir.adhubbackand.model.dto.response.UserProfileResponse;
import com.bsuir.adhubbackand.security.UserDetailsImpl;
import com.bsuir.adhubbackand.services.FavoriteService;
import com.bsuir.adhubbackand.services.UserAvatarService;
import com.bsuir.adhubbackand.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserAvatarService userAvatarService;
    private final FavoriteService favoriteService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        UserProfileResponse profile = userService.getProfile(userDetails.getId());
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/me")
    public ResponseEntity<UserMeResponse> getMe(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        UserMeResponse me = userService.getMe(userDetails.getId());
        return ResponseEntity.ok(me);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse updatedProfile = userService.updateProfile(userDetails.getId(), request);
        return ResponseEntity.ok(updatedProfile);
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userDetails.getId(), request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/avatar")
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        String avatarUrl = userAvatarService.uploadAvatar(userDetails.getId(), file);

        Map<String, String> response = Map.of(
                "avatarUrl", avatarUrl,
                "message", "Аватар успешно обновлен"
        );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<Void> deleteAvatar(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        userAvatarService.deleteAvatar(userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/favorites")
    public ResponseEntity<FavoriteListResponse> getMyFavorites(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        FavoriteListResponse favorites = favoriteService.getUserFavorites(userDetails.getId());
        return ResponseEntity.ok(favorites);
    }
}