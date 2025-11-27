package com.bsuir.adhubbackand.config;

import com.bsuir.adhubbackand.model.entities.UserRole;
import com.bsuir.adhubbackand.repositories.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRoleRepository userRoleRepository;

    @Override
    public void run(String... args) {
        initializeRoles();
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

