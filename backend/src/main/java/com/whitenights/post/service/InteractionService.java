package com.whitenights.post.service;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.post.api.dto.CommentResponse;
import com.whitenights.post.domain.*;
import com.whitenights.post.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final LikeRepository likeRepository;
    private final SaveRepository saveRepository;
    private final ViewRepository viewRepository;
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    @Transactional
    public void like(Long postId, User user) {
        Post post = requirePost(postId);
        Like.UserPostId id = new Like.UserPostId(user.getUserId(), postId);
        if (!likeRepository.existsById(id)) {
            likeRepository.save(Like.builder().id(id).user(user).post(post).build());
        }
    }

    @Transactional
    public void unlike(Long postId, User user) {
        likeRepository.deleteById(new Like.UserPostId(user.getUserId(), postId));
    }

    @Transactional
    public void save(Long postId, User user) {
        Post post = requirePost(postId);
        Save.UserPostId id = new Save.UserPostId(user.getUserId(), postId);
        if (!saveRepository.existsById(id)) {
            saveRepository.save(Save.builder().id(id).user(user).post(post).build());
        }
    }

    @Transactional
    public void unsave(Long postId, User user) {
        saveRepository.deleteById(new Save.UserPostId(user.getUserId(), postId));
    }

    @Transactional
    public void view(Long postId, User user) {
        Post post = requirePost(postId);
        View.UserPostId id = new View.UserPostId(user.getUserId(), postId);
        if (!viewRepository.existsById(id)) {
            viewRepository.save(View.builder().id(id).user(user).post(post).build());
        }
    }

    public boolean isLiked(Long postId, Long userId) {
        return likeRepository.existsById(new Like.UserPostId(userId, postId));
    }

    public boolean isSaved(Long postId, Long userId) {
        return saveRepository.existsById(new Save.UserPostId(userId, postId));
    }

    public Set<Long> getLikedPostIds(Long userId, Collection<Long> postIds) {
        if (postIds.isEmpty()) return Set.of();
        return likeRepository.findLikedPostIds(userId, postIds);
    }

    public Set<Long> getSavedPostIds(Long userId, Collection<Long> postIds) {
        if (postIds.isEmpty()) return Set.of();
        return saveRepository.findSavedPostIds(userId, postIds);
    }

    @Transactional
    public CommentResponse addComment(Long postId, String text, User user) {
        Post post = requirePost(postId);
        Comment comment = Comment.builder().post(post).user(user).text(text).build();
        return toCommentResponse(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        boolean isAuthor = comment.getUser().getUserId().equals(user.getUserId());
        boolean isModerator = user.getRole() == UserRole.moderator || user.getRole() == UserRole.admin;

        if (!isAuthor && !isModerator) {
            throw new RuntimeException("Access denied");
        }

        commentRepository.delete(comment);
    }

    public List<CommentResponse> getComments(Long postId, Long cursor, int limit) {
        return commentRepository.findByPostIdWithCursor(postId, cursor, PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(this::toCommentResponse)
                .toList();
    }

    public List<PostSummaryHelper> getSavedPosts(Long userId, Long cursor, int limit) {
        return saveRepository.findByUserIdWithCursor(userId, cursor, PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(s -> new PostSummaryHelper(s.getPost(), s.getId().getPostId()))
                .toList();
    }

    private Post requirePost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    private CommentResponse toCommentResponse(Comment c) {
        return new CommentResponse(
                c.getCommentId(),
                c.getText(),
                c.getCreatedAt(),
                new CommentResponse.AuthorInfo(
                        c.getUser().getUserId(),
                        c.getUser().getNickname(),
                        c.getUser().getAvatarUrl()
                )
        );
    }

    public record PostSummaryHelper(Post post, Long postId) {}
}
