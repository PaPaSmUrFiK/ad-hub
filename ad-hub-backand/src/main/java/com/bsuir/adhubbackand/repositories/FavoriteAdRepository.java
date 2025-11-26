package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.FavoriteAd;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteAdRepository extends JpaRepository<FavoriteAd, Long> {

    List<FavoriteAd> findByUserId(Long userId);

    Page<FavoriteAd> findByUserId(Long userId, Pageable pageable);

    List<FavoriteAd> findByAdId(Long adId);

    Optional<FavoriteAd> findByUserIdAndAdId(Long userId, Long adId);

    boolean existsByUserIdAndAdId(Long userId, Long adId);

    long countByUserId(Long userId);

    long countByAdId(Long adId);

    @Modifying
    @Query("DELETE FROM FavoriteAd fa WHERE fa.user.id = :userId AND fa.ad.id = :adId")
    void deleteByUserIdAndAdId(@Param("userId") Long userId, @Param("adId") Long adId);

    @Modifying
    @Query("DELETE FROM FavoriteAd fa WHERE fa.ad.id = :adId")
    void deleteByAdId(@Param("adId") Long adId);

    @Modifying
    @Query("DELETE FROM FavoriteAd fa WHERE fa.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Query("SELECT fa.ad.id FROM FavoriteAd fa WHERE fa.user.id = :userId")
    List<Long> findAdIdsByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(fa) FROM FavoriteAd fa WHERE fa.ad.id IN :adIds")
    long countFavoritesByAdIds(@Param("adIds") List<Long> adIds);
}