package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.SelfRatingException;
import com.bsuir.adhubbackand.exception.UserNotFoundException;
import com.bsuir.adhubbackand.model.dto.request.user.UserRatingRequest;
import com.bsuir.adhubbackand.model.dto.response.UserRatingsResponse;
import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.model.entities.UserRating;
import com.bsuir.adhubbackand.repositories.UserRatingRepository;
import com.bsuir.adhubbackand.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserRatingService {

    private final UserRatingRepository userRatingRepository;
    private final UserRepository userRepository;

    @Transactional
    public void rateUser(Long ratedUserId, Long raterUserId, UserRatingRequest request) {
        if (ratedUserId.equals(raterUserId)) {
            throw new SelfRatingException("Нельзя оценить самого себя");
        }

        User ratedUser = userRepository.findById(ratedUserId)
                .orElseThrow(() -> new UserNotFoundException(ratedUserId));

        User raterUser = userRepository.findById(raterUserId)
                .orElseThrow(() -> new UserNotFoundException(raterUserId));

        // Проверяем, не оценивал ли уже этот пользователь (обновляем если есть)
        UserRating existingRating = userRatingRepository
                .findByRatedUserIdAndRaterUserId(ratedUserId, raterUserId)
                .orElse(null);

        UserRating rating;
        if (existingRating != null) {
            // Обновляем существующую оценку
            existingRating.setRatingValue(BigDecimal.valueOf(request.score()));
            existingRating.setComment(request.comment());
            rating = existingRating;
            log.info("Оценка обновлена: пользователь {} -> пользователь {}: {}",
                    raterUser.getUsername(), ratedUser.getUsername(), request.score());
        } else {
            // Создаем новую оценку
            rating = UserRating.builder()
                    .ratedUser(ratedUser)
                    .raterUser(raterUser)
                    .ratingValue(BigDecimal.valueOf(request.score()))
                    .comment(request.comment())
                    .build();
            log.info("Новая оценка: пользователь {} -> пользователь {}: {}",
                    raterUser.getUsername(), ratedUser.getUsername(), request.score());
        }

        userRatingRepository.save(rating);
    }

    public UserRatingsResponse getUserRatingsWithStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        List<UserRating> ratings = userRatingRepository.findByRatedUserId(userId);

        if (ratings.isEmpty()) {
            return new UserRatingsResponse(BigDecimal.ZERO, 0, List.of());
        }

        // Расчет средней оценки
        double average = ratings.stream()
                .mapToDouble(rating -> rating.getRatingValue().doubleValue())
                .average()
                .orElse(0.0);

        BigDecimal averageRating = BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP);

        // Формирование items
        List<UserRatingsResponse.RatingItem> items = ratings.stream()
                .map(this::mapToRatingItem)
                .toList();

        return new UserRatingsResponse(averageRating, ratings.size(), items);
    }

    public List<UserRatingsResponse.RatingItem> getMyRatings(Long userId) {
        List<UserRating> ratings = userRatingRepository.findByRaterUserId(userId);
        return ratings.stream()
                .map(this::mapToRatingItem)
                .toList();
    }

    private UserRatingsResponse.RatingItem mapToRatingItem(UserRating rating) {
        return new UserRatingsResponse.RatingItem(
                rating.getRaterUser().getId(),
                rating.getRaterUser().getUsername(),
                rating.getRatingValue().intValue(),
                rating.getComment(),
                rating.getCreatedAt().toLocalDate().toString()
        );
    }
}