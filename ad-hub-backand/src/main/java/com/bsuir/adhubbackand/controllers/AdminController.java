package com.bsuir.adhubbackand.controllers;

import com.bsuir.adhubbackand.model.dto.request.admin.UpdateUserRoleRequest;
import com.bsuir.adhubbackand.model.dto.response.admin.ModerationActionResponse;
import com.bsuir.adhubbackand.model.dto.response.admin.PendingAdResponse;
import com.bsuir.adhubbackand.model.dto.response.admin.UserListResponse;
import com.bsuir.adhubbackand.security.UserDetailsImpl;
import com.bsuir.adhubbackand.services.AdminAdService;
import com.bsuir.adhubbackand.services.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public class AdminController {

    private final AdminAdService adminAdService;
    private final AdminUserService adminUserService;

    // Модерация объявлений
    @GetMapping("/ads/pending")
    public ResponseEntity<List<PendingAdResponse>> getPendingAds(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        List<PendingAdResponse> pendingAds = adminAdService.getPendingAds(page, size);
        return ResponseEntity.ok(pendingAds);
    }

    @PostMapping("/ads/{id}/approve")
    public ResponseEntity<ModerationActionResponse> approveAd(@PathVariable Long id) {
        ModerationActionResponse response = adminAdService.approveAd(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ads/{id}/reject")
    public ResponseEntity<ModerationActionResponse> rejectAd(@PathVariable Long id) {
        ModerationActionResponse response = adminAdService.rejectAd(id);
        return ResponseEntity.ok(response);
    }

    // Управление пользователями
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserListResponse> getUsers(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String search) {
        UserListResponse users = adminUserService.getUsers(page, size, search);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/block")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> blockUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        adminUserService.blockUser(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/unblock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> unblockUser(@PathVariable Long id) {
        adminUserService.unblockUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        adminUserService.updateUserRole(id, request, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/statistics/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SearchStatisticsResponse> getSearchStatistics() {
        // TODO: Реализовать сбор статистики поиска
        SearchStatisticsResponse stats = new SearchStatisticsResponse(
                0L, // totalSearches
                0L, // searchesToday
                0L, // searchesThisWeek
                0L, // searchesThisMonth
                List.of() // topQueries
        );
        return ResponseEntity.ok(stats);
    }

    public record SearchStatisticsResponse(
            Long totalSearches,
            Long searchesToday,
            Long searchesThisWeek,
            Long searchesThisMonth,
            List<TopQuery> topQueries
    ) {
        public record TopQuery(String query, Long count) {}
    }
}

