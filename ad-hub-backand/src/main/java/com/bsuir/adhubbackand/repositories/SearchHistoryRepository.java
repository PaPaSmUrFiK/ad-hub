package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.SearchHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {

    List<SearchHistory> findByUserId(Long userId);

    Page<SearchHistory> findByUserId(Long userId, Pageable pageable);

    List<SearchHistory> findByUserIdOrderBySearchDateDesc(Long userId);

    @Query("SELECT sh FROM SearchHistory sh WHERE sh.user.id = :userId ORDER BY sh.searchDate DESC")
    List<SearchHistory> findRecentSearchesByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT sh.queryText, COUNT(sh) as searchCount FROM SearchHistory sh WHERE sh.searchDate >= :sinceDate GROUP BY sh.queryText ORDER BY searchCount DESC")
    List<Object[]> findPopularSearches(@Param("sinceDate") LocalDateTime sinceDate, Pageable pageable);

    @Query("SELECT COUNT(sh) FROM SearchHistory sh WHERE sh.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM SearchHistory sh WHERE sh.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM SearchHistory sh WHERE sh.searchDate < :date")
    void deleteOldSearches(@Param("date") LocalDateTime date);

    @Query("SELECT DISTINCT sh.queryText FROM SearchHistory sh WHERE sh.user.id = :userId AND LOWER(sh.queryText) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY sh.searchDate DESC")
    List<String> findSimilarQueriesByUser(@Param("userId") Long userId, @Param("query") String query, Pageable pageable);
}