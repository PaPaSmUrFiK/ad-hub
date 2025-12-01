package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.FileUploadException;
import com.bsuir.adhubbackand.exception.UserNotFoundException;
import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAvatarService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    public String uploadAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        validateImageFile(file);

        // Удаляем старый аватар если есть
        if (user.getAvatarUrl() != null) {
            deleteOldAvatar(user.getAvatarUrl());
        }

        // Загружаем новый аватар
        String fileName = generateAvatarFileName(file);
        String storedFileName = fileStorageService.uploadFile(file, FileStorageService.AVATARS_FOLDER, fileName);
        String fileUrl = fileStorageService.getFileUrl(storedFileName);

        // Обновляем пользователя
        user.setAvatarUrl(fileUrl);
        userRepository.save(user);

        log.info("Аватар обновлен для пользователя: {}", user.getEmail());
        return fileUrl;
    }

    public void deleteAvatar(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (user.getAvatarUrl() != null) {
            deleteOldAvatar(user.getAvatarUrl());
            user.setAvatarUrl(null);
            userRepository.save(user);
            log.info("Аватар удален для пользователя: {}", user.getEmail());
        }
    }

    public void setDefaultAvatar(User user) {
        // Можно реализовать разные варианты дефолтного аватара:

        // Вариант 1: Генерация аватара на основе имени
        // String avatarUrl = generateAvatarFromName(user.getFirstName(), user.getLastName());

        // Вариант 2: Статичный дефолтный аватар
        // String avatarUrl = "/static/default-avatar.png";

        // Вариант 3: Пока оставляем null (аватар не обязателен)
        String avatarUrl = null;

        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        log.info("Дефолтный аватар установлен для пользователя: {}", user.getEmail());
    }

    // Опционально: метод для генерации аватара на основе имени
    private String generateAvatarFromName(String firstName, String lastName) {
        if (firstName == null && lastName == null) return null;

        String initials = "";
        if (firstName != null && !firstName.isEmpty()) {
            initials += firstName.charAt(0);
        }
        if (lastName != null && !lastName.isEmpty()) {
            initials += lastName.charAt(0);
        }

        if (initials.isEmpty()) return null;

        // Здесь можно сгенерировать SVG или использовать внешний сервис
        // Пока возвращаем null - можно доработать позже
        return null;
    }

    private void deleteOldAvatar(String avatarUrl) {
        try {
            // FileStorageService теперь работает с путями в формате "bucketName/filename"
            // Извлекаем путь из URL
            String filePath = extractFilePathFromUrl(avatarUrl);
            if (filePath != null) {
                fileStorageService.deleteFile(filePath);
            }
        } catch (Exception e) {
            log.warn("Не удалось удалить старый аватар: {}", e.getMessage());
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileUploadException("Файл не должен быть пустым");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileUploadException("Размер файла не должен превышать 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new FileUploadException("Допустимые форматы: JPEG, PNG, GIF, WebP");
        }
    }

    private String generateAvatarFileName(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        return "avatar_" + UUID.randomUUID() + fileExtension;
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return ".jpg";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }

    /**
     * Извлекает путь к файлу из presigned URL
     * URL может содержать bucket name в пути
     */
    private String extractFilePathFromUrl(String url) {
        if (url == null || url.isEmpty()) {
            return null;
        }
        try {
            // Presigned URL обычно имеет формат: http://host:port/bucketName/filename?params
            java.net.URI uri = new java.net.URI(url);
            java.net.URL urlObj = uri.toURL();
            String path = urlObj.getPath();
            
            // Убираем первый слэш если есть
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            
            // Убираем параметры запроса
            String query = urlObj.getQuery();
            if (query != null && path.contains("?")) {
                path = path.split("\\?")[0];
            }
            
            // Если путь содержит bucket name (adhub-avatars или adhub-ads-media), возвращаем как есть
            // Иначе пытаемся определить по имени файла
            if (path.contains("adhub-")) {
                return path; // Уже содержит bucket name
            } else {
                // Для обратной совместимости: если файл начинается с "avatar_", это аватар
                String fileName = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
                if (fileName.startsWith("avatar_")) {
                    // Возвращаем путь с bucket name для аватаров
                    return "adhub-avatars/" + fileName;
                }
                return path;
            }
        } catch (Exception e) {
            log.warn("Не удалось извлечь путь из URL: {}", url, e);
            return null;
        }
    }
}