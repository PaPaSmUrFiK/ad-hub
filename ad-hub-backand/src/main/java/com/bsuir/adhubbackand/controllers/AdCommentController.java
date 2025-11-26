package com.bsuir.adhubbackand.controllers;

import com.bsuir.adhubbackand.model.dto.request.comment.CreateCommentRequest;
import com.bsuir.adhubbackand.model.dto.request.comment.UpdateCommentRequest;
import com.bsuir.adhubbackand.model.dto.response.CommentResponse;
import com.bsuir.adhubbackand.security.UserDetailsImpl;
import com.bsuir.adhubbackand.services.AdCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ads")
@RequiredArgsConstructor
public class AdCommentController {

    private final AdCommentService commentService;

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CreateCommentRequest request) {
        CommentResponse comment = commentService.createComment(id, userDetails.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id) {
        List<CommentResponse> comments = commentService.getCommentsByAdId(id);
        return ResponseEntity.ok(comments);
    }

    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UpdateCommentRequest request) {
        CommentResponse comment = commentService.updateComment(id, commentId, userDetails.getId(), request);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long id,
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        commentService.deleteComment(id, commentId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}

