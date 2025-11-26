package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUserId(Long userId);

    List<RefreshToken> findByExpiryDateBefore(LocalDateTime date);

    boolean existsByToken(String token);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :currentDate")
    void deleteExpiredTokens(@Param("currentDate") LocalDateTime currentDate);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}