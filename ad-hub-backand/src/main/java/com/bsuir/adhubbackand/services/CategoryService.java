package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.CategoryAlreadyExistsException;
import com.bsuir.adhubbackand.exception.CategoryHasAdsException;
import com.bsuir.adhubbackand.exception.CategoryNotFoundException;
import com.bsuir.adhubbackand.model.dto.request.category.CreateCategoryRequest;
import com.bsuir.adhubbackand.model.dto.request.category.UpdateCategoryRequest;
import com.bsuir.adhubbackand.model.dto.response.CategoryResponse;
import com.bsuir.adhubbackand.model.entities.Category;
import com.bsuir.adhubbackand.repositories.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));
        return mapToCategoryResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new CategoryAlreadyExistsException("Категория с названием " + request.name() + " уже существует");
        }

        Category category = Category.builder()
                .name(request.name())
                .description(request.description())
                .build();

        Category savedCategory = categoryRepository.save(category);
        log.info("Создана новая категория: {}", savedCategory.getName());

        return mapToCategoryResponse(savedCategory);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));

        // Обновляем название, если оно предоставлено
        if (request.name() != null && !request.name().isBlank()) {
            // Проверяем уникальность названия (если оно изменяется)
            if (!category.getName().equals(request.name()) &&
                    categoryRepository.existsByName(request.name())) {
                throw new CategoryAlreadyExistsException("Категория с названием " + request.name() + " уже существует");
            }
            category.setName(request.name());
        }

        // Обновляем описание, если оно предоставлено
        if (request.description() != null) {
            category.setDescription(request.description());
        }

        Category updatedCategory = categoryRepository.save(category);
        log.info("Обновлена категория с ID: {}", updatedCategory.getId());

        return mapToCategoryResponse(updatedCategory);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));

        // Проверяем, есть ли объявления в этой категории
        if (!category.getAds().isEmpty()) {
            throw new CategoryHasAdsException(id);
        }

        categoryRepository.delete(category);
        log.info("Удалена категория с ID: {}", id);
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getCreatedAt()
        );
    }
}