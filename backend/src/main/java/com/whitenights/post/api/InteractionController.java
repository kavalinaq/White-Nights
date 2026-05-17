package com.whitenights.post.api;

import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.post.api.dto.CommentResponse;
import com.whitenights.post.api.dto.CreateCommentRequest;
import com.whitenights.post.service.InteractionService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;
  private final CurrentUserResolver currentUserResolver;

    @PostMapping("/api/posts/{id}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void like(@PathVariable Long id, @AuthenticationPrincipal String email) {
      interactionService.like(id, currentUserResolver.resolve(email));
    }

    @DeleteMapping("/api/posts/{id}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlike(@PathVariable Long id, @AuthenticationPrincipal String email) {
      interactionService.unlike(id, currentUserResolver.resolve(email));
    }

    @PostMapping("/api/posts/{id}/save")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@PathVariable Long id, @AuthenticationPrincipal String email) {
      interactionService.save(id, currentUserResolver.resolve(email));
    }

    @DeleteMapping("/api/posts/{id}/save")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsave(@PathVariable Long id, @AuthenticationPrincipal String email) {
      interactionService.unsave(id, currentUserResolver.resolve(email));
    }

    @PostMapping("/api/posts/{id}/view")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void view(@PathVariable Long id, @AuthenticationPrincipal String email) {
      interactionService.view(id, currentUserResolver.resolve(email));
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
      return interactionService.addComment(id, request.text(), request.parentCommentId(), currentUserResolver.resolve(email));
    }

    @GetMapping("/api/comments/{id}/replies")
    public List<CommentResponse> getReplies(
            @PathVariable Long id,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit) {
        return interactionService.getReplies(id, cursor, limit);
    }

    @DeleteMapping("/api/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long id, @AuthenticationPrincipal String email) {
      interactionService.deleteComment(id, currentUserResolver.resolve(email));
    }

}
