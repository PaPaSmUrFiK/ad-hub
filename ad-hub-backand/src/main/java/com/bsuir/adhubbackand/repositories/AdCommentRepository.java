package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.AdComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdCommentRepository extends JpaRepository<AdComment, Long> {

    List<AdComment> findByAdId(Long adId);

    Page<AdComment> findByAdId(Long adId, Pageable pageable);

    List<AdComment> findByUserId(Long userId);

    Page<AdComment> findByUserId(Long userId, Pageable pageable);

    List<AdComment> findByAdIdAndIsActiveTrue(Long adId);

    Page<AdComment> findByAdIdAndIsActiveTrue(Long adId, Pageable pageable);

    List<AdComment> findByUserIdAndIsActiveTrue(Long userId);

    long countByAdId(Long adId);

    long countByAdIdAndIsActiveTrue(Long adId);

    long countByUserId(Long userId);

    @Query("SELECT ac FROM AdComment ac WHERE ac.ad.id = :adId AND ac.isActive = true ORDER BY ac.createdAt DESC")
    List<AdComment> findActiveCommentsByAdOrderByDate(@Param("adId") Long adId, Pageable pageable);

    @Modifying
    @Query("UPDATE AdComment ac SET ac.isActive = false WHERE ac.id = :commentId")
    void deactivateComment(@Param("commentId") Long commentId);

    @Modifying
    @Query("UPDATE AdComment ac SET ac.isActive = false WHERE ac.ad.id = :adId")
    void deactivateAllCommentsByAdId(@Param("adId") Long adId);

    @Modifying
    @Query("UPDATE AdComment ac SET ac.isActive = false WHERE ac.user.id = :userId")
    void deactivateAllCommentsByUserId(@Param("userId") Long userId);
}