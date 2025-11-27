package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.model.dto.request.auth.LoginRequest;
import com.bsuir.adhubbackand.model.dto.request.auth.LogoutRequest;
import com.bsuir.adhubbackand.model.dto.request.auth.RefreshTokenRequest;
import com.bsuir.adhubbackand.model.dto.request.auth.RegisterRequest;
import com.bsuir.adhubbackand.model.dto.response.AuthResponse;
import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.model.entities.RefreshToken;
import com.bsuir.adhubbackand.model.entities.UserRole;
import com.bsuir.adhubbackand.model.enums.UserStatus;
import com.bsuir.adhubbackand.exception.EmailAlreadyExistsException;
import com.bsuir.adhubbackand.exception.RefreshTokenExpiredException;
import com.bsuir.adhubbackand.exception.RefreshTokenNotFoundException;
import com.bsuir.adhubbackand.exception.RoleNotFoundException;
import com.bsuir.adhubbackand.exception.UsernameAlreadyExistsException;
import com.bsuir.adhubbackand.repositories.RefreshTokenRepository;
import com.bsuir.adhubbackand.repositories.UserRepository;
import com.bsuir.adhubbackand.repositories.UserRoleRepository;
import com.bsuir.adhubbackand.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final UserAvatarService userAvatarService; // Добавлен сервис аватаров

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Регистрация пользователя с email: {}", request.email());

        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(request.username());
        }

        UserRole userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RoleNotFoundException("Роль USER не найдена в базе данных"));

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .username(request.username())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phone(request.phone())
                .role(userRole)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Пользователь успешно зарегистрирован с ID: {}", savedUser.getId());

        // Устанавливаем дефолтный аватар для нового пользователя
        userAvatarService.setDefaultAvatar(savedUser);
        log.info("Дефолтный аватар установлен для пользователя: {}", savedUser.getEmail());

        String accessToken = jwtService.generateAccessToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        RefreshToken refresh = RefreshToken.builder()
                .user(savedUser)
                .token(refreshToken)
                .expiryDate(jwtService.extractExpirationLocal(refreshToken))
                .build();

        refreshTokenRepository.save(refresh);
        log.info("Токены сгенерированы для пользователя: {}", savedUser.getEmail());

        return new AuthResponse(accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Попытка входа для пользователя с email: {}", request.email());

        // Используем метод с JOIN FETCH для загрузки роли вместе с пользователем
        User user = userRepository.findByEmailWithRole(request.email())
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь с email " + request.email() + " не найден"));
        
        // Проверяем, что роль загружена
        if (user.getRole() == null) {
            log.error("Роль пользователя не загружена для email: {}", request.email());
            throw new IllegalStateException("Роль пользователя не загружена");
        }
        
        log.info("Роль пользователя при входе: {}", user.getRole().getName());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Неверный пароль");
        }

        // Обновляем время последнего входа
        user.setLastLogin(java.time.LocalDateTime.now());
        userRepository.save(user);
        log.info("Время последнего входа обновлено для пользователя: {}", user.getEmail());

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        refreshTokenRepository.deleteByUserId(user.getId());

        RefreshToken refreshed = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiryDate(jwtService.extractExpirationLocal(refreshToken))
                .build();

        refreshTokenRepository.save(refreshed);
        log.info("Пользователь успешно вошел: {}", user.getEmail());

        return new AuthResponse(accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        log.info("Попытка обновления токена");

        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new RefreshTokenNotFoundException("Refresh токен не найден"));

        if (jwtService.isTokenExpired(request.refreshToken())) {
            refreshTokenRepository.delete(stored);
            throw new RefreshTokenExpiredException("Refresh токен истек");
        }

        User user = stored.getUser();

        String newRefreshToken = jwtService.generateRefreshToken(user);
        String newAccessToken = jwtService.generateAccessToken(user);

        stored.setToken(newRefreshToken);
        stored.setExpiryDate(jwtService.extractExpirationLocal(newRefreshToken));

        refreshTokenRepository.save(stored);
        log.info("Токены обновлены для пользователя: {}", user.getEmail());

        return new AuthResponse(newAccessToken, newRefreshToken);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        log.info("Выход пользователя из системы");
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new RefreshTokenNotFoundException("Refresh токен не найден"));

        refreshTokenRepository.delete(refreshToken);
        log.info("Пользователь успешно вышел из системы");
    }
}