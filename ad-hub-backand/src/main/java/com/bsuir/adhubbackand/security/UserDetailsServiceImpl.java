package com.bsuir.adhubbackand.security;

import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.model.enums.UserStatus;
import com.bsuir.adhubbackand.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Используем метод с JOIN FETCH для загрузки роли вместе с пользователем
        User user = userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден с email: " + email));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new DisabledException("Пользователь заблокирован");
        }

        // Проверяем, что роль загружена
        if (user.getRole() == null) {
            throw new IllegalStateException("Роль пользователя не загружена для email: " + email);
        }

        return UserDetailsImpl.fromUser(user);
    }
}