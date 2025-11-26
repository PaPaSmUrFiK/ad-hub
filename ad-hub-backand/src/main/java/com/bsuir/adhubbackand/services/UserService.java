package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.InvalidPasswordException;
import com.bsuir.adhubbackand.exception.UserNotFoundException;
import com.bsuir.adhubbackand.exception.UsernameAlreadyExistsException;
import com.bsuir.adhubbackand.model.dto.request.user.ChangePasswordRequest;
import com.bsuir.adhubbackand.model.dto.request.user.UpdateProfileRequest;
import com.bsuir.adhubbackand.model.dto.response.UserMeResponse;
import com.bsuir.adhubbackand.model.dto.response.UserProfileResponse;
import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User getCurrentUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    public UserProfileResponse getProfile(Long userId) {
        User user = getCurrentUser(userId);
        return mapToProfileResponse(user);
    }

    public UserMeResponse getMe(Long userId) {
        User user = getCurrentUser(userId);
        boolean isProfileFilled = user.getFirstName() != null &&
                user.getLastName() != null &&
                user.getPhone() != null;

        return new UserMeResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole().getName(),
                isProfileFilled
        );
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getCurrentUser(userId);

        // Проверка уникальности username
        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new UsernameAlreadyExistsException(request.username());
            }
            user.setUsername(request.username());
        }

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }

        User updatedUser = userRepository.save(user);
        log.info("Профиль обновлен для пользователя: {}", user.getEmail());

        return mapToProfileResponse(updatedUser);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getCurrentUser(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidPasswordException("Текущий пароль неверен");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Пароль изменен для пользователя: {}", user.getEmail());
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getAvatarUrl(),
                user.getRole().getName(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}