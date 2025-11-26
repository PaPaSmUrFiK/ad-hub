package com.bsuir.adhubbackand.repositories;

import com.bsuir.adhubbackand.model.entities.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    List<Category> findByNameContainingIgnoreCase(String name);

    Page<Category> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT c FROM Category c ORDER BY c.createdAt DESC")
    List<Category> findAllOrderByCreatedAtDesc();

    @Query("SELECT COUNT(a) FROM Ad a WHERE a.category.id = :categoryId")
    long countAdsByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT c, COUNT(a) as adCount FROM Category c LEFT JOIN c.ads a GROUP BY c ORDER BY adCount DESC")
    List<Object[]> findCategoriesWithAdCount();
}