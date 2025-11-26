package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.AdMedia;
import com.bsuir.adhubbackand.model.enums.FileType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdMediaRepository extends JpaRepository<AdMedia, Long> {

    List<AdMedia> findByAdId(Long adId);

    List<AdMedia> findByAdIdOrderByDisplayOrderAsc(Long adId);

    List<AdMedia> findByAdIdAndFileType(Long adId, FileType fileType);

    Optional<AdMedia> findByAdIdAndIsPrimaryTrue(Long adId);

    List<AdMedia> findByAdIdAndIsPrimaryFalse(Long adId);

    long countByAdId(Long adId);

    long countByAdIdAndFileType(Long adId, FileType fileType);

    @Query("SELECT am FROM AdMedia am WHERE am.ad.id = :adId AND am.isPrimary = true")
    Optional<AdMedia> findPrimaryMediaByAdId(@Param("adId") Long adId);

    @Modifying
    @Query("UPDATE AdMedia am SET am.isPrimary = false WHERE am.ad.id = :adId")
    void clearPrimaryMediaByAdId(@Param("adId") Long adId);

    @Modifying
    @Query("UPDATE AdMedia am SET am.isPrimary = true WHERE am.id = :mediaId")
    void setAsPrimaryMedia(@Param("mediaId") Long mediaId);

    @Modifying
    @Query("DELETE FROM AdMedia am WHERE am.ad.id = :adId")
    void deleteByAdId(@Param("adId") Long adId);

    @Query("SELECT am FROM AdMedia am WHERE am.ad.id = :adId ORDER BY am.displayOrder ASC, am.createdAt ASC")
    List<AdMedia> findAllByAdIdOrdered(@Param("adId") Long adId);
}