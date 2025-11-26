package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserId(Long userId);

    Page<Notification> findByUserId(Long userId, Pageable pageable);

    List<Notification> findByUserIdAndIsReadFalse(Long userId);

    Page<Notification> findByUserIdAndIsReadFalse(Long userId, Pageable pageable);

    List<Notification> findByUserIdAndIsReadTrue(Long userId);

    List<Notification> findByNotificationTypeId(Long typeId);

    List<Notification> findByRelatedAdId(Long adId);

    long countByUserId(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId ORDER BY n.sentAt DESC")
    List<Notification> findLatestNotificationsByUser(@Param("userId") Long userId, Pageable pageable);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id IN :notificationIds")
    void markAsRead(@Param("notificationIds") List<Long> notificationIds, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadByUser(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId AND n.isRead = true AND n.readAt < :date")
    void deleteOldReadNotifications(@Param("userId") Long userId, @Param("date") LocalDateTime date);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.sentAt < :date")
    void deleteOldNotifications(@Param("date") LocalDateTime date);

    @Query("SELECT n FROM Notification n WHERE n.sentAt >= :startDate AND n.sentAt < :endDate")
    List<Notification> findNotificationsBetweenDates(@Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);
}