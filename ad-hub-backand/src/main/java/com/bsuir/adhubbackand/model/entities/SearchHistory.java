package com.bsuir.adhubbackand.model.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "search_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @NotBlank(message = "Текст запроса обязателен")
    @Size(max = 1000, message = "Текст запроса не должен превышать 1000 символов")
    @Column(name = "query_text", columnDefinition = "TEXT", nullable = false)
    private String queryText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filters", columnDefinition = "jsonb")
    private String filters;

    @PositiveOrZero(message = "Количество результатов не может быть отрицательным")
    @Column(name = "results_count")
    private Integer resultsCount;

    @Column(name = "search_date", nullable = false)
    private LocalDateTime searchDate;

    @Size(max = 45, message = "IP-адрес не должен превышать 45 символов")
    @Column(name = "ip_address")
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        if (searchDate == null) {
            searchDate = LocalDateTime.now();
        }
    }
}