package com.whitenights.post.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.post.api.dto.CreatePostRequest;
import com.whitenights.post.api.dto.PostSummaryResponse;
import com.whitenights.post.api.dto.UpdatePostRequest;
import com.whitenights.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UserRepository userRepository;

    @PostMapping("/api/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public PostSummaryResponse create(
            @RequestPart("data") @Valid CreatePostRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal String email) {
        User user = resolveUser(email);
        return postService.create(request, image, user);
    }

    @GetMapping("/api/posts/{id}")
    public PostSummaryResponse getById(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        User viewer = email != null ? resolveUser(email) : null;
        return postService.getById(id, viewer);
    }

    @PatchMapping("/api/posts/{id}")
    public PostSummaryResponse update(
            @PathVariable Long id,
            @RequestPart("data") @Valid UpdatePostRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal String email) {
        User user = resolveUser(email);
        return postService.update(id, request, image, user);
    }

    @DeleteMapping("/api/posts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        User user = resolveUser(email);
        postService.delete(id, user);
    }

    @GetMapping("/api/users/{userId}/posts")
    public List<PostSummaryResponse> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
        User viewer = email != null ? resolveUser(email) : null;
        return postService.getUserPosts(userId, cursor, limit, viewer);
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
