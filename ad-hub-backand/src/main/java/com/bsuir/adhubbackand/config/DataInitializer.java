package com.bsuir.adhubbackand.config;

import com.bsuir.adhubbackand.model.entities.UserRole;
import com.bsuir.adhubbackand.repositories.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Выполняется первым, до MinioInitializer
public class DataInitializer implements CommandLineRunner {

    private final UserRoleRepository userRoleRepository;
    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        // Сначала проверяем подключение к БД
        checkDatabaseConnection();
        // Затем инициализируем роли
        initializeRoles();
    }

    /**
     * Проверяет подключение к базе данных
     */
    private void checkDatabaseConnection() {
        try {
            log.info("=== Проверка подключения к базе данных ===");
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                String databaseProductName = metaData.getDatabaseProductName();
                String databaseProductVersion = metaData.getDatabaseProductVersion();
                String url = metaData.getURL();
                
                log.info("Подключение к БД успешно установлено");
                log.info("Тип БД: {} версия: {}", databaseProductName, databaseProductVersion);
                log.info("URL БД: {}", url);
                log.info("=== Проверка подключения к базе данных завершена успешно ===");
            }
        } catch (Exception e) {
            log.error("=== КРИТИЧЕСКАЯ ОШИБКА при подключении к базе данных ===", e);
            log.error("Не удалось подключиться к базе данных");
            log.error("Убедитесь, что PostgreSQL запущен и доступен");
            log.error("Проверьте настройки подключения в application.properties:");
            log.error("  - spring.datasource.url");
            log.error("  - spring.datasource.username");
            log.error("  - spring.datasource.password");
            log.error("Приложение не может быть запущено без подключения к базе данных");
            // Бросаем исключение, чтобы остановить запуск приложения
            throw new RuntimeException("КРИТИЧЕСКАЯ ОШИБКА: Не удалось подключиться к базе данных. Приложение не может быть запущено.", e);
        }
    }

    private void initializeRoles() {
        log.info("Проверка и инициализация ролей пользователей...");

        // Инициализация роли USER
        if (!userRoleRepository.existsByName("USER")) {
            UserRole userRole = UserRole.builder()
                    .name("USER")
                    .build();
            userRoleRepository.save(userRole);
            log.info("Роль USER создана");
        } else {
            log.info("Роль USER уже существует");
        }

        // Инициализация роли MODERATOR
        if (!userRoleRepository.existsByName("MODERATOR")) {
            UserRole moderatorRole = UserRole.builder()
                    .name("MODERATOR")
                    .build();
            userRoleRepository.save(moderatorRole);
            log.info("Роль MODERATOR создана");
        } else {
            log.info("Роль MODERATOR уже существует");
        }

        // Инициализация роли ADMIN
        if (!userRoleRepository.existsByName("ADMIN")) {
            UserRole adminRole = UserRole.builder()
                    .name("ADMIN")
                    .build();
            userRoleRepository.save(adminRole);
            log.info("Роль ADMIN создана");
        } else {
            log.info("Роль ADMIN уже существует");
        }

        log.info("Инициализация ролей завершена");
    }
}

