package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.model.dto.response.admin.SearchStatisticsResponse;
import com.bsuir.adhubbackand.model.dto.response.admin.SearchStatisticsResponse.TopQuery;
import com.bsuir.adhubbackand.repositories.SearchHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminStatisticsService {

    private final SearchHistoryRepository searchHistoryRepository;

    @Transactional(readOnly = true)
    public SearchStatisticsResponse getSearchStatistics() {
        log.info("Получение статистики поиска");

        // Всего поисков
        long totalSearches = searchHistoryRepository.countAll();

        // Поиски за сегодня
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        long searchesToday = searchHistoryRepository.countBySearchDateAfter(todayStart);

        // Поиски за эту неделю (последние 7 дней)
        LocalDateTime weekStart = LocalDateTime.of(LocalDate.now().minusDays(7), LocalTime.MIN);
        long searchesThisWeek = searchHistoryRepository.countBySearchDateAfter(weekStart);

        // Поиски за этот месяц (последние 30 дней)
        LocalDateTime monthStart = LocalDateTime.of(LocalDate.now().minusDays(30), LocalTime.MIN);
        long searchesThisMonth = searchHistoryRepository.countBySearchDateAfter(monthStart);

        // Популярные запросы (топ 10 за последние 30 дней)
        Pageable topQueriesPageable = PageRequest.of(0, 10);
        List<Object[]> popularSearchesData = searchHistoryRepository.findPopularSearches(monthStart, topQueriesPageable);
        
        List<TopQuery> topQueries = popularSearchesData.stream()
                .map(result -> {
                    String query = (String) result[0];
                    Long count = ((Number) result[1]).longValue();
                    return new TopQuery(query, count);
                })
                .collect(Collectors.toList());

        log.info("Статистика поиска: всего={}, сегодня={}, за неделю={}, за месяц={}, популярных запросов={}",
                totalSearches, searchesToday, searchesThisWeek, searchesThisMonth, topQueries.size());

        return new SearchStatisticsResponse(
                totalSearches,
                searchesToday,
                searchesThisWeek,
                searchesThisMonth,
                topQueries
        );
    }
}

