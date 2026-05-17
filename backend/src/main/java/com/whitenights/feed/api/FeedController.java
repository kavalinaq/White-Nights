package com.whitenights.feed.api;

import com.whitenights.auth.domain.User;
import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.feed.service.FeedService;
import com.whitenights.post.api.dto.PostSummaryResponse;
import com.whitenights.post.domain.Post;
import com.whitenights.post.service.InteractionService;
import com.whitenights.post.service.PostService;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;
    private final PostService postService;
    private final InteractionService interactionService;
  private final CurrentUserResolver currentUserResolver;

    @GetMapping("/api/feed")
    public List<PostSummaryResponse> getFeed(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal String email) {
      User viewer = currentUserResolver.resolve(email);
        List<Post> posts = feedService.getFeed(viewer, cursor, limit);
        return enrichWithFlags(posts, viewer);
    }

    private List<PostSummaryResponse> enrichWithFlags(List<Post> posts, User viewer) {
        if (posts.isEmpty()) {
            return List.of();
        }
        Set<Long> postIds = posts.stream().map(Post::getPostId).collect(Collectors.toSet());
        Set<Long> likedIds = interactionService.getLikedPostIds(viewer.getUserId(), postIds);
        Set<Long> savedIds = interactionService.getSavedPostIds(viewer.getUserId(), postIds);
        return posts.stream()
                .map(p -> postService.toSummary(p, likedIds.contains(p.getPostId()), savedIds.contains(p.getPostId())))
                .toList();
    }

}
