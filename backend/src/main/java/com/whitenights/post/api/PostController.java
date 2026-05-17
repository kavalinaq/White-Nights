package com.whitenights.post.api;

import com.whitenights.auth.domain.User;
import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.post.api.dto.CreatePostRequest;
import com.whitenights.post.api.dto.PostSummaryResponse;
import com.whitenights.post.api.dto.UpdatePostRequest;
import com.whitenights.post.domain.Post;
import com.whitenights.post.service.InteractionService;
import com.whitenights.post.service.PostService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final InteractionService interactionService;
  private final CurrentUserResolver currentUserResolver;

    @PostMapping("/api/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public PostSummaryResponse create(
            @RequestPart("data") @Valid CreatePostRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal String email) {
      return postService.create(request, image, currentUserResolver.resolve(email));
    }

    @GetMapping("/api/posts/{id}")
    public PostSummaryResponse getById(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
      User viewer = email != null ? currentUserResolver.resolve(email) : null;
        Post post = postService.findById(id, viewer);
        boolean liked = viewer != null && interactionService.isLiked(id, viewer.getUserId());
        boolean saved = viewer != null && interactionService.isSaved(id, viewer.getUserId());
        return postService.toSummary(post, liked, saved);
    }

    @PatchMapping("/api/posts/{id}")
    public PostSummaryResponse update(
            @PathVariable Long id,
            @RequestPart("data") @Valid UpdatePostRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal String email) {
      return postService.update(id, request, image, currentUserResolver.resolve(email));
    }

    @DeleteMapping("/api/posts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
      postService.delete(id, currentUserResolver.resolve(email));
    }

    @GetMapping("/api/users/{userId}/posts")
    public List<PostSummaryResponse> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
      User viewer = email != null ? currentUserResolver.resolve(email) : null;
        List<Post> posts = postService.findUserPosts(userId, cursor, limit, viewer);
        return enrichWithFlags(posts, viewer);
    }

    private List<PostSummaryResponse> enrichWithFlags(List<Post> posts, User viewer) {
        if (viewer == null || posts.isEmpty()) {
            return posts.stream().map(p -> postService.toSummary(p, false, false)).toList();
        }
        Set<Long> postIds = posts.stream().map(Post::getPostId).collect(Collectors.toSet());
        Set<Long> likedIds = interactionService.getLikedPostIds(viewer.getUserId(), postIds);
        Set<Long> savedIds = interactionService.getSavedPostIds(viewer.getUserId(), postIds);
        return posts.stream()
                .map(p -> postService.toSummary(p, likedIds.contains(p.getPostId()), savedIds.contains(p.getPostId())))
                .toList();
    }

}
