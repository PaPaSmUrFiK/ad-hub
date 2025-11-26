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

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден с email: " + email));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new DisabledException("Пользователь заблокирован");
        }

        return UserDetailsImpl.fromUser(user);
    }
}