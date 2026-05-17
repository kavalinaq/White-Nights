package com.whitenights.tag.api;

import com.whitenights.common.exception.types.BadRequestException;
import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.post.api.dto.PostSummaryResponse;
import com.whitenights.post.repository.PostRepository;
import com.whitenights.tag.api.dto.TagResponse;
import com.whitenights.tag.service.TagService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;
  private final CurrentUserResolver currentUserResolver;
    private final PostRepository postRepository;

    @GetMapping("/search")
    public List<TagResponse> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {
        if (q == null || q.isBlank()) {
          throw new BadRequestException("Query must not be blank");
        }
        return tagService.search(q, Math.min(limit, 50)).stream()
                .map(t -> new TagResponse(t.getTagId(), t.getName()))
                .toList();
    }

    @GetMapping("/recent")
    public List<TagResponse> recent(
            @AuthenticationPrincipal String email,
            @RequestParam(defaultValue = "10") int limit) {
      Long userId = currentUserResolver.resolve(email).getUserId();
        return tagService.recent(userId, Math.min(limit, 20)).stream()
                .map(t -> new TagResponse(t.getTagId(), t.getName()))
                .toList();
    }

    @GetMapping("/{name}/posts")
    public List<PostSummaryResponse> postsByTag(
            @PathVariable String name,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit) {
        return postRepository.findByTagName(name, cursor, PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(p -> new PostSummaryResponse(
                        p.getPostId(),
                        p.getImageUrl(),
                        p.getTitle(),
                        p.getAuthor(),
                        p.getDescription(),
                        p.getCreatedAt(),
                        new PostSummaryResponse.AuthorInfo(
                                p.getUser().getUserId(),
                                p.getUser().getNickname(),
                                p.getUser().getAvatarUrl()
                        ),
                        p.getTags().stream()
                                .map(t -> new TagResponse(t.getTagId(), t.getName()))
                                .toList(),
                        p.getLikeCount(), p.getCommentCount(), p.getViewCount(),
                        false, false
                ))
                .toList();
    }
}
