package com.whitenights.post.service;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.storage.StorageService;
import com.whitenights.post.api.dto.CreatePostRequest;
import com.whitenights.post.api.dto.PostSummaryResponse;
import com.whitenights.post.api.dto.UpdatePostRequest;
import com.whitenights.post.domain.Post;
import com.whitenights.post.repository.PostRepository;
import com.whitenights.tag.api.dto.TagResponse;
import com.whitenights.tag.domain.Tag;
import com.whitenights.tag.service.TagService;
import com.whitenights.user.domain.FollowStatus;
import com.whitenights.user.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final TagService tagService;
    private final StorageService storageService;

    @Value("${minio.posts-bucket}")
    private String postsBucket;

    @Transactional
    public PostSummaryResponse create(CreatePostRequest request, MultipartFile image, User author) {
        String imageUrl = uploadImage(image);

        Set<Tag> tags = resolveTags(request.tagNames(), request.tagIds());

        Post post = Post.builder()
                .user(author)
                .title(request.title())
                .author(request.author())
                .description(request.description())
                .imageUrl(imageUrl)
                .tags(tags)
                .build();

        return toSummary(postRepository.save(post), false, false);
    }

    public PostSummaryResponse getById(Long postId, User viewer) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        checkReadAccess(post, viewer);
        return toSummary(post, false, false);
    }

    @Transactional
    public PostSummaryResponse update(Long postId, UpdatePostRequest request, MultipartFile image, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getUserId().equals(currentUser.getUserId())) {
            throw new RuntimeException("Access denied");
        }

        if (request.title() != null) post.setTitle(request.title());
        if (request.author() != null) post.setAuthor(request.author());
        if (request.description() != null) post.setDescription(request.description());

        if (image != null && !image.isEmpty()) {
            deleteImageIfPresent(post.getImageUrl());
            post.setImageUrl(uploadImage(image));
        }

        if (request.tagNames() != null || request.tagIds() != null) {
            post.setTags(resolveTags(request.tagNames(), request.tagIds()));
        }

        return toSummary(postRepository.save(post), false, false);
    }

    @Transactional
    public void delete(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean isAuthor = post.getUser().getUserId().equals(currentUser.getUserId());
        boolean isModerator = currentUser.getRole() == UserRole.moderator || currentUser.getRole() == UserRole.admin;

        if (!isAuthor && !isModerator) {
            throw new RuntimeException("Access denied");
        }

        deleteImageIfPresent(post.getImageUrl());
        postRepository.delete(post);
    }

    public List<PostSummaryResponse> getUserPosts(Long userId, Long cursor, int limit, User viewer) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isSelf = viewer != null && viewer.getUserId().equals(userId);
        if (targetUser.isPrivate() && !isSelf) {
            boolean follows = viewer != null && followRepository
                    .findByFollowerAndFollowee(viewer, targetUser)
                    .map(f -> f.getStatus() == FollowStatus.accepted)
                    .orElse(false);
            if (!follows) {
                throw new com.whitenights.common.exception.types.UnauthorizedException("Profile is private");
            }
        }

        return postRepository.findByUserWithCursor(targetUser, cursor, PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(p -> toSummary(p, false, false))
                .toList();
    }

    public PostSummaryResponse toSummary(Post post, boolean liked, boolean saved) {
        return new PostSummaryResponse(
                post.getPostId(),
                post.getImageUrl(),
                post.getTitle(),
                post.getAuthor(),
                post.getDescription(),
                post.getCreatedAt(),
                new PostSummaryResponse.AuthorInfo(
                        post.getUser().getUserId(),
                        post.getUser().getNickname(),
                        post.getUser().getAvatarUrl()
                ),
                post.getTags().stream()
                        .map(t -> new TagResponse(t.getTagId(), t.getName()))
                        .toList(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getViewCount(),
                liked,
                saved
        );
    }

    private Set<Tag> resolveTags(List<String> tagNames, List<Long> tagIds) {
        Set<Tag> tags = new HashSet<>();

        if (tagNames != null) {
            tagNames.stream()
                    .filter(n -> n != null && !n.isBlank())
                    .limit(10)
                    .map(tagService::findOrCreate)
                    .forEach(tags::add);
        }

        if (tagIds != null) {
            tagIds.stream()
                    .limit(10 - tags.size())
                    .map(tagService::findById)
                    .forEach(tags::add);
        }

        return tags;
    }

    private String uploadImage(MultipartFile image) {
        if (image == null || image.isEmpty()) return null;
        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }
        String filename = UUID.randomUUID() + "_" + image.getOriginalFilename();
        return storageService.uploadFile(postsBucket, filename, image);
    }

    private void deleteImageIfPresent(String imageUrl) {
        if (imageUrl != null) {
            String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            storageService.deleteFile(postsBucket, filename);
        }
    }

    private void checkReadAccess(Post post, User viewer) {
        User postOwner = post.getUser();
        if (!postOwner.isPrivate()) return;

        boolean isSelf = viewer != null && viewer.getUserId().equals(postOwner.getUserId());
        if (isSelf) return;

        boolean follows = viewer != null && followRepository
                .findByFollowerAndFollowee(viewer, postOwner)
                .map(f -> f.getStatus() == FollowStatus.accepted)
                .orElse(false);

        if (!follows) {
            throw new com.whitenights.common.exception.types.UnauthorizedException("Profile is private");
        }
    }
}
