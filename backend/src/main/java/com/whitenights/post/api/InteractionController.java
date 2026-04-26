package com.whitenights.post.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.post.api.dto.CommentResponse;
import com.whitenights.post.api.dto.CreateCommentRequest;
import com.whitenights.post.service.InteractionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;
    private final UserRepository userRepository;

    @PostMapping("/api/posts/{id}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void like(@PathVariable Long id, @AuthenticationPrincipal String email) {
        interactionService.like(id, resolveUser(email));
    }

    @DeleteMapping("/api/posts/{id}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlike(@PathVariable Long id, @AuthenticationPrincipal String email) {
        interactionService.unlike(id, resolveUser(email));
    }

    @PostMapping("/api/posts/{id}/save")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@PathVariable Long id, @AuthenticationPrincipal String email) {
        interactionService.save(id, resolveUser(email));
    }

    @DeleteMapping("/api/posts/{id}/save")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsave(@PathVariable Long id, @AuthenticationPrincipal String email) {
        interactionService.unsave(id, resolveUser(email));
    }

    @PostMapping("/api/posts/{id}/view")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void view(@PathVariable Long id, @AuthenticationPrincipal String email) {
        interactionService.view(id, resolveUser(email));
    }

    @GetMapping("/api/posts/{id}/comments")
    public List<CommentResponse> getComments(
            @PathVariable Long id,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit) {
        return interactionService.getComments(id, cursor, limit);
    }

    @PostMapping("/api/posts/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse addComment(
            @PathVariable Long id,
            @RequestBody @Valid CreateCommentRequest request,
            @AuthenticationPrincipal String email) {
        return interactionService.addComment(id, request.text(), resolveUser(email));
    }

    @DeleteMapping("/api/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long id, @AuthenticationPrincipal String email) {
        interactionService.deleteComment(id, resolveUser(email));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
