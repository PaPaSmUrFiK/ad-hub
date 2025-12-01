package com.bsuir.adhubbackand.model.dto.response.admin;

import java.util.List;

public record SearchStatisticsResponse(
        Long totalSearches,
        Long searchesToday,
        Long searchesThisWeek,
        Long searchesThisMonth,
        List<TopQuery> topQueries
) {
    public record TopQuery(String query, Long count) {}
}

