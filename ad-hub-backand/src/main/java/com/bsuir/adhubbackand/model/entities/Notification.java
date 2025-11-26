package com.bsuir.adhubbackand.model.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull(message = "Пользователь обязателен")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Тип уведомления обязателен")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    private NotificationType notificationType;

    @NotBlank(message = "Заголовок обязателен")
    @Size(max = 200, message = "Заголовок не должен превышать 200 символов")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @NotBlank(message = "Сообщение обязательно")
    @Size(max = 2000, message = "Сообщение не должно превышать 2000 символов")
    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @NotNull(message = "Дата отправки обязательна")
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @NotNull(message = "Статус прочтения обязателен")
    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_ad_id")
    private Ad relatedAd;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }
}