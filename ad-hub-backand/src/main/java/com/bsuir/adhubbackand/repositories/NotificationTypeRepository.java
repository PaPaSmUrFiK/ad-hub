package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationTypeRepository extends JpaRepository<NotificationType, Long> {

    Optional<NotificationType> findByName(String name);

    boolean existsByName(String name);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.notificationType.id = :typeId")
    long countNotificationsByTypeId(@Param("typeId") Long typeId);
}