package com.bsuir.adhubbackand.controllers;

import com.bsuir.adhubbackand.model.dto.request.notification.CreateNotificationRequest;
import com.bsuir.adhubbackand.model.dto.response.NotificationResponse;
import com.bsuir.adhubbackand.model.dto.response.NotificationTypeResponse;
import com.bsuir.adhubbackand.model.entities.NotificationType;
import com.bsuir.adhubbackand.security.UserDetailsImpl;
import com.bsuir.adhubbackand.services.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        if (page != null || size != null) {
            Page<NotificationResponse> notifications = notificationService.getUserNotifications(
                    userDetails.getId(), page, size
            );
            return ResponseEntity.ok(notifications.getContent());
        } else {
            List<NotificationResponse> notifications = notificationService.getUserNotifications(userDetails.getId());
            return ResponseEntity.ok(notifications);
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(count);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        notificationService.markAsRead(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        notificationService.markAllAsRead(userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        notificationService.deleteNotification(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/types")
    public ResponseEntity<List<NotificationTypeResponse>> getNotificationTypes() {
        List<NotificationType> types = notificationService.getAllNotificationTypes();
        List<NotificationTypeResponse> response = types.stream()
                .map(type -> new NotificationTypeResponse(
                        type.getId(),
                        type.getName(),
                        type.getTemplate(),
                        type.getDescription()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<NotificationResponse> createNotification(
            @Valid @RequestBody CreateNotificationRequest request
    ) {
        NotificationResponse response = notificationService.createNotification(request);
        return ResponseEntity.ok(response);
    }
}

