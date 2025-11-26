package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.NotificationNotFoundException;
import com.bsuir.adhubbackand.exception.UserNotFoundException;
import com.bsuir.adhubbackand.model.dto.response.NotificationResponse;
import com.bsuir.adhubbackand.model.entities.Notification;
import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.repositories.NotificationRepository;
import com.bsuir.adhubbackand.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Pageable pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "sentAt"));
        List<Notification> notifications = notificationRepository.findLatestNotificationsByUser(userId, pageable);
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(Long userId, Integer page, Integer size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        int pageNumber = page != null && page > 0 ? page - 1 : 0;
        int pageSize = size != null && size > 0 ? size : 20;

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "sentAt"));
        Page<Notification> notificationPage = notificationRepository.findByUserId(userId, pageable);

        return notificationPage.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));

        // Проверяем, что уведомление принадлежит пользователю
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Уведомление не принадлежит пользователю");
        }

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            log.info("Уведомление {} отмечено как прочитанное пользователем {}", notificationId, userId);
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        notificationRepository.markAllAsReadByUser(userId, LocalDateTime.now());
        log.info("Все уведомления пользователя {} отмечены как прочитанные", userId);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));

        // Проверяем, что уведомление принадлежит пользователю
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Уведомление не принадлежит пользователю");
        }

        notificationRepository.delete(notification);
        log.info("Уведомление {} удалено пользователем {}", notificationId, userId);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getNotificationType() != null ? notification.getNotificationType().getName() : null,
                notification.getIsRead(),
                notification.getSentAt(),
                notification.getReadAt(),
                notification.getRelatedAd() != null ? notification.getRelatedAd().getId() : null,
                notification.getRelatedAd() != null ? notification.getRelatedAd().getTitle() : null
        );
    }
}

