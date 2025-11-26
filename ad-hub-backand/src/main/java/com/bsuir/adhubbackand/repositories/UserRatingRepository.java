package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.UserRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRatingRepository extends JpaRepository<UserRating, Long> {

    List<UserRating> findByRatedUserId(Long ratedUserId);

    Page<UserRating> findByRatedUserId(Long ratedUserId, Pageable pageable);

    List<UserRating> findByRaterUserId(Long raterUserId);

    Page<UserRating> findByRaterUserId(Long raterUserId, Pageable pageable);

    Optional<UserRating> findByRatedUserIdAndRaterUserId(Long ratedUserId, Long raterUserId);

    boolean existsByRatedUserIdAndRaterUserId(Long ratedUserId, Long raterUserId);

    long countByRatedUserId(Long ratedUserId);

    long countByRaterUserId(Long raterUserId);

    @Query("SELECT AVG(ur.ratingValue) FROM UserRating ur WHERE ur.ratedUser.id = :userId")
    Optional<BigDecimal> calculateAverageRatingByUserId(@Param("userId") Long userId);

    @Query("SELECT ur FROM UserRating ur WHERE ur.ratedUser.id = :userId ORDER BY ur.createdAt DESC")
    List<UserRating> findLatestRatingsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT ur.ratedUser.id, AVG(ur.ratingValue) as avgRating FROM UserRating ur GROUP BY ur.ratedUser.id HAVING COUNT(ur) >= :minRatings ORDER BY avgRating DESC")
    List<Object[]> findTopRatedUsers(@Param("minRatings") int minRatings, Pageable pageable);

    @Query("SELECT COUNT(ur) FROM UserRating ur WHERE ur.ratedUser.id = :userId AND ur.ratingValue >= :minRating")
    long countByRatedUserIdAndMinRating(@Param("userId") Long userId, @Param("minRating") BigDecimal minRating);
}