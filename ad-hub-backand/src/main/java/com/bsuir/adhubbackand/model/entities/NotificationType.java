package com.bsuir.adhubbackand.model.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notification_types")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotBlank(message = "Название типа уведомления обязательно")
    @Size(max = 100, message = "Название типа уведомления не должно превышать 100 символов")
    @Column(name = "name", unique = true, nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Шаблон обязателен")
    @Size(max = 1000, message = "Шаблон не должен превышать 1000 символов")
    @Column(name = "template", columnDefinition = "TEXT", nullable = false)
    private String template;

    @Size(max = 500, message = "Описание не должно превышать 500 символов")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "notificationType", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Notification> notifications = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}