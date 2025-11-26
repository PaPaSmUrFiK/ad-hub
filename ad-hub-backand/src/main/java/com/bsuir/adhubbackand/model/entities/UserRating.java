package com.bsuir.adhubbackand.model.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRating {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull(message = "Оцениваемый пользователь обязателен")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rated_user_id", nullable = false)
    private User ratedUser;

    @NotNull(message = "Оценивающий пользователь обязателен")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_user_id", nullable = false)
    private User raterUser;

    @NotNull(message = "Значение оценки обязательно")
    @DecimalMin(value = "1.0", message = "Оценка должна быть не менее 1.0")
    @DecimalMax(value = "5.0", message = "Оценка должна быть не более 5.0")
    @Digits(integer = 1, fraction = 1, message = "Оценка должна иметь до 1 целой и 1 дробной цифры")
    @Column(name = "rating_value", nullable = false, precision = 2, scale = 1)
    private BigDecimal ratingValue;

    @Size(max = 500, message = "Комментарий не должен превышать 500 символов")
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Бизнес-валидация: пользователь не может оценить сам себя
    @AssertTrue(message = "Пользователь не может оценить сам себя")
    private boolean isNotSelfRating() {
        return ratedUser == null || raterUser == null || !ratedUser.getId().equals(raterUser.getId());
    }
}