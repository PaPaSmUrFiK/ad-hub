package com.bsuir.adhubbackand.services;

import com.bsuir.adhubbackand.exception.AccessDeniedException;
import com.bsuir.adhubbackand.exception.AdNotFoundException;
import com.bsuir.adhubbackand.exception.CommentNotFoundException;
import com.bsuir.adhubbackand.exception.UserNotFoundException;
import com.bsuir.adhubbackand.model.dto.request.comment.CreateCommentRequest;
import com.bsuir.adhubbackand.model.dto.request.comment.UpdateCommentRequest;
import com.bsuir.adhubbackand.model.dto.response.CommentResponse;
import com.bsuir.adhubbackand.model.entities.Ad;
import com.bsuir.adhubbackand.model.entities.AdComment;
import com.bsuir.adhubbackand.model.entities.User;
import com.bsuir.adhubbackand.repositories.AdCommentRepository;
import com.bsuir.adhubbackand.repositories.AdRepository;
import com.bsuir.adhubbackand.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class AdCommentService {

    private final AdCommentRepository commentRepository;
    private final AdRepository adRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentResponse createComment(Long adId, Long userId, CreateCommentRequest request) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        AdComment comment = AdComment.builder()
                .ad(ad)
                .user(user)
                .commentText(request.commentText())
                .isActive(true)
                .build();

        AdComment savedComment = commentRepository.save(comment);
        log.info("Комментарий создан: commentId={}, adId={}, userId={}", savedComment.getId(), adId, userId);

        return mapToResponse(savedComment);
    }

    public List<CommentResponse> getCommentsByAdId(Long adId) {
        if (!adRepository.existsById(adId)) {
            throw new AdNotFoundException(adId);
        }

        Pageable pageable = PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AdComment> comments = commentRepository.findByAdIdAndIsActiveTrue(adId, pageable).getContent();

        return comments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse updateComment(Long adId, Long commentId, Long userId, UpdateCommentRequest request) {
        if (!adRepository.existsById(adId)) {
            throw new AdNotFoundException(adId);
        }

        AdComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new com.bsuir.adhubbackand.exception.CommentNotFoundException(commentId));

        // Проверяем, что комментарий принадлежит объявлению
        if (!comment.getAd().getId().equals(adId)) {
            throw new CommentNotFoundException("Комментарий не принадлежит этому объявлению");
        }

        // Проверяем, что пользователь является автором комментария
        if (!comment.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Нет доступа к редактированию этого комментария");
        }

        // Проверяем, что комментарий активен
        if (!Boolean.TRUE.equals(comment.getIsActive())) {
            throw new CommentNotFoundException("Нельзя редактировать удаленный комментарий");
        }

        comment.setCommentText(request.commentText());
        AdComment updatedComment = commentRepository.save(comment);
        log.info("Комментарий обновлен: commentId={}, adId={}", commentId, adId);

        return mapToResponse(updatedComment);
    }

    @Transactional
    public void deleteComment(Long adId, Long commentId, Long userId) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new AdNotFoundException(adId));

        AdComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new com.bsuir.adhubbackand.exception.CommentNotFoundException(commentId));

        // Проверяем, что комментарий принадлежит объявлению
        if (!comment.getAd().getId().equals(adId)) {
            throw new CommentNotFoundException("Комментарий не принадлежит этому объявлению");
        }

        // Проверяем, что пользователь является автором комментария или владельцем объявления
        boolean isCommentAuthor = comment.getUser().getId().equals(userId);
        boolean isAdOwner = ad.getUser().getId().equals(userId);

        if (!isCommentAuthor && !isAdOwner) {
            throw new AccessDeniedException("Нет доступа к удалению этого комментария");
        }

        // Мягкое удаление - деактивируем комментарий
        comment.setIsActive(false);
        commentRepository.save(comment);
        log.info("Комментарий удален: commentId={}, adId={}", commentId, adId);
    }

    private CommentResponse mapToResponse(AdComment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getAd().getId(),
                comment.getUser().getId(),
                comment.getUser().getUsername(),
                comment.getCommentText(),
                comment.getIsActive(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}

