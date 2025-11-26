package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.Ad;
import com.bsuir.adhubbackand.model.enums.AdStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AdRepository extends JpaRepository<Ad, Long> {

    List<Ad> findByUserId(Long userId);

    Page<Ad> findByUserId(Long userId, Pageable pageable);

    List<Ad> findByCategoryId(Long categoryId);

    Page<Ad> findByCategoryId(Long categoryId, Pageable pageable);

    List<Ad> findByStatus(AdStatus status);

    Page<Ad> findByStatus(AdStatus status, Pageable pageable);

    List<Ad> findByUserIdAndStatus(Long userId, AdStatus status);

    Page<Ad> findByUserIdAndStatus(Long userId, AdStatus status, Pageable pageable);

    @Query("SELECT a FROM Ad a WHERE a.status = 'ACTIVE' AND a.price BETWEEN :minPrice AND :maxPrice")
    List<Ad> findActiveAdsByPriceRange(@Param("minPrice") BigDecimal minPrice,
                                       @Param("maxPrice") BigDecimal maxPrice);

    @Query("SELECT a FROM Ad a WHERE a.status = 'ACTIVE' AND LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(a.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Ad> searchActiveAds(@Param("query") String query, Pageable pageable);

    @Query("SELECT a FROM Ad a WHERE a.status = 'ACTIVE' AND a.category.id = :categoryId AND (LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(a.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Ad> searchActiveAdsByCategory(@Param("query") String query,
                                       @Param("categoryId") Long categoryId,
                                       Pageable pageable);

    @Query("SELECT a FROM Ad a WHERE a.status = 'ACTIVE' AND a.location LIKE %:location%")
    Page<Ad> findActiveAdsByLocation(@Param("location") String location, Pageable pageable);

    @Query("SELECT a FROM Ad a WHERE a.status = 'ACTIVE' ORDER BY a.createdAt DESC")
    List<Ad> findRecentActiveAds(Pageable pageable);

    @Query("SELECT a FROM Ad a WHERE a.status = 'ACTIVE' ORDER BY a.viewCount DESC")
    List<Ad> findPopularActiveAds(Pageable pageable);

    @Query("SELECT COUNT(a) FROM Ad a WHERE a.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(a) FROM Ad a WHERE a.status = :status")
    long countByStatus(@Param("status") AdStatus status);

    @Modifying
    @Query("UPDATE Ad a SET a.status = :status WHERE a.id = :adId")
    void updateAdStatus(@Param("adId") Long adId, @Param("status") AdStatus status);

    @Modifying
    @Query("UPDATE Ad a SET a.viewCount = a.viewCount + 1 WHERE a.id = :adId")
    void incrementViewCount(@Param("adId") Long adId);

    @Query("SELECT a FROM Ad a WHERE a.createdAt < :date AND a.status = 'ACTIVE'")
    List<Ad> findOldActiveAds(@Param("date") LocalDateTime date);

    @Query("SELECT a FROM Ad a WHERE a.user.id = :userId AND a.status = 'ACTIVE' ORDER BY a.createdAt DESC")
    List<Ad> findActiveAdsByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT a FROM Ad a WHERE " +
            "a.status = 'ACTIVE' " +
            "AND (:searchQuery IS NULL OR :searchQuery = '' OR " +
            "     (LOWER(a.title) LIKE LOWER(CONCAT('%', :searchQuery, '%')) OR " +
            "      LOWER(a.description) LIKE LOWER(CONCAT('%', :searchQuery, '%')))) " +
            "AND (:categoryId IS NULL OR a.category.id = :categoryId) " +
            "AND (:minPrice IS NULL OR a.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR a.price <= :maxPrice) " +
            "AND (:location IS NULL OR :location = '' OR LOWER(a.location) LIKE LOWER(CONCAT('%', :location, '%')))")
    Page<Ad> searchAdsWithFilters(
            @Param("searchQuery") String searchQuery,
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("location") String location,
            Pageable pageable);
}