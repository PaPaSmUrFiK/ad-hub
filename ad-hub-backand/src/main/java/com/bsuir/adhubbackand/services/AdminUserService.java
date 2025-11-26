package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.UserNotFoundException;
import com.bsuir.adhubbackand.model.dto.request.admin.UpdateUserRoleRequest;
import com.bsuir.adhubbackand.model.dto.response.admin.UserListResponse;
import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.model.entities.UserRole;
import com.bsuir.adhubbackand.model.enums.UserStatus;
import com.bsuir.adhubbackand.repositories.AdRepository;
import com.bsuir.adhubbackand.repositories.UserRepository;
import com.bsuir.adhubbackand.repositories.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final AdRepository adRepository;
    private final UserRoleRepository userRoleRepository;

    public UserListResponse getUsers(Integer page, Integer size, String search) {
        Pageable pageable = PageRequest.of(
                page != null && page > 0 ? page - 1 : 0,
                size != null && size > 0 ? size : 20,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<User> userPage;
        if (search != null && !search.trim().isEmpty()) {
            userPage = userRepository.searchUsers(search.trim(), pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        List<UserListResponse.UserListItem> userItems = userPage.getContent().stream()
                .map(user -> {
                    long adsCount = adRepository.countByUserId(user.getId());
                    return new UserListResponse.UserListItem(
                            user.getId(),
                            user.getUsername(),
                            user.getEmail(),
                            user.getFirstName(),
                            user.getLastName(),
                            user.getPhone(),
                            user.getRole().getName(),
                            user.getStatus(),
                            user.getRating(),
                            user.getCreatedAt(),
                            user.getLastLogin(),
                            adsCount
                    );
                })
                .collect(Collectors.toList());

        return new UserListResponse(
                userItems,
                userPage.getNumber() + 1,
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.hasNext(),
                userPage.hasPrevious()
        );
    }

    @Transactional
    public void blockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new RuntimeException("Пользователь уже заблокирован");
        }

        user.setStatus(UserStatus.BLOCKED);
        userRepository.save(user);

        log.info("Пользователь заблокирован: userId={}, email={}", userId, user.getEmail());
    }

    @Transactional
    public void unblockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (user.getStatus() != UserStatus.BLOCKED) {
            throw new RuntimeException("Пользователь не заблокирован");
        }

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        log.info("Пользователь разблокирован: userId={}, email={}", userId, user.getEmail());
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateUserRole(Long userId, UpdateUserRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserRole newRole = userRoleRepository.findByName(request.roleName())
                .orElseThrow(() -> new RuntimeException("Роль " + request.roleName() + " не найдена"));

        String oldRole = user.getRole().getName();
        user.setRole(newRole);
        userRepository.save(user);

        log.info("Роль пользователя изменена: userId={}, email={}, старый роль={}, новая роль={}", 
                userId, user.getEmail(), oldRole, request.roleName());
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Проверяем, что пользователь не является последним администратором
        if ("ADMIN".equals(user.getRole().getName())) {
            long adminCount = userRoleRepository.countUsersByRoleId(user.getRole().getId());
            if (adminCount <= 1) {
                throw new RuntimeException("Нельзя удалить последнего администратора");
            }
        }

        // Удаляем пользователя (каскадное удаление настроено в JPA)
        userRepository.delete(user);

        log.info("Пользователь удален: userId={}, email={}", userId, user.getEmail());
    }
}

