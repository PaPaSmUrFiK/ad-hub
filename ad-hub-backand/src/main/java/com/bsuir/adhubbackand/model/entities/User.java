package com.bsuir.adhubbackand.model.entities;

import com.bsuir.adhubbackand.model.enums.UserStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotBlank(message = "Имя пользователя обязательно")
    @Size(min = 3, max = 50, message = "Имя пользователя должно быть от 3 до 50 символов")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Имя пользователя может содержать только буквы, цифры и подчеркивания")
    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;

    @NotBlank(message = "Email обязателен")
    @Email(message = "Некорректный формат email")
    @Size(max = 100, message = "Email не должен превышать 100 символов")
    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;

    @NotBlank(message = "Хэш пароля обязателен")
    @Size(min = 60, max = 255, message = "Хэш пароля должен быть от 60 до 255 символов")
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Size(max = 50, message = "Имя не должно превышать 50 символов")
    @Column(name = "first_name", length = 50)
    private String firstName;

    @Size(max = 50, message = "Фамилия не должна превышать 50 символов")
    @Column(name = "last_name", length = 50)
    private String lastName;

    @Size(max = 20, message = "Телефон не должен превышать 20 символов")
    @Pattern(regexp = "^\\+375 \\(\\d{2}\\) \\d{3}-\\d{2}-\\d{2}$", message = "Формат телефона: +375 (XX) XXX-XX-XX")
    @Column(name = "phone", length = 20)
    private String phone;

    @Size(max = 500, message = "URL аватара не должен превышать 500 символов")
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @NotNull(message = "Роль обязательна")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private UserRole role;

    @NotNull(message = "Статус обязателен")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @DecimalMin(value = "1.0", message = "Рейтинг должен быть не менее 1.0")
    @DecimalMax(value = "5.0", message = "Рейтинг должен быть не более 5.0")
    @Digits(integer = 1, fraction = 2, message = "Рейтинг должен иметь до 1 целой и 2 дробных цифр")
    @Column(name = "rating", precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PastOrPresent(message = "Последний вход должен быть в прошлом или настоящем")
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Двусторонние связи
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Ad> ads = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<AdComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "ratedUser", fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserRating> receivedRatings = new ArrayList<>();

    @OneToMany(mappedBy = "raterUser", fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserRating> givenRatings = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<FavoriteAd> favoriteAds = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<RefreshToken> refreshTokens = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @Builder.Default
    private List<SearchHistory> searchHistory = new ArrayList<>();

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
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