package com.bsuir.adhubbackand.model.entities;

import com.bsuir.adhubbackand.model.enums.AdStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ads")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotBlank(message = "Заголовок обязателен")
    @Size(min = 5, max = 200, message = "Заголовок должен быть от 5 до 200 символов")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @NotBlank(message = "Описание обязательно")
    @Size(min = 10, max = 5000, message = "Описание должно быть от 10 до 5000 символов")
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @PositiveOrZero(message = "Цена должна быть положительной или нулевой")
    @Digits(integer = 10, fraction = 2, message = "Цена должна иметь до 10 целых и 2 дробных цифр")
    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price;

    @Size(max = 3, message = "Валюта не должна превышать 3 символов")
    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "BYN";

    @Size(max = 200, message = "Местоположение не должно превышать 200 символов")
    @Column(name = "location", length = 200)
    private String location;

    @NotNull(message = "Статус обязателен")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AdStatus status = AdStatus.ACTIVE;

    @NotNull(message = "Пользователь обязателен")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Категория обязательна")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Min(value = 0, message = "Количество просмотров не может быть отрицательным")
    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Двусторонние связи
    @OneToMany(mappedBy = "ad", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private List<AdComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "ad", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private List<AdMedia> mediaFiles = new ArrayList<>();

    @OneToMany(mappedBy = "ad", fetch = FetchType.LAZY)
    @Builder.Default
    private List<FavoriteAd> favoriteByUsers = new ArrayList<>();

    @OneToMany(mappedBy = "relatedAd", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Notification> notifications = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}