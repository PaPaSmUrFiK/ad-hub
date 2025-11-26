package com.bsuir.adhubbackand.model.entities;

import com.bsuir.adhubbackand.model.enums.FileType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ad_media")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull(message = "Объявление обязательно")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ad_id", nullable = false)
    private Ad ad;

    @NotBlank(message = "URL файла обязателен")
    @Size(max = 500, message = "URL файла не должен превышать 500 символов")
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @NotNull(message = "Тип файла обязателен")
    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 50)
    private FileType fileType;

    @NotNull(message = "Флаг основного файла обязателен")
    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @PositiveOrZero(message = "Порядок отображения не может быть отрицательным")
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}