package com.whitenights.post.repository;

import com.whitenights.post.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("""
            SELECT c FROM Comment c
            JOIN FETCH c.user
            WHERE c.post.postId = :postId
              AND (:cursor IS NULL OR c.commentId > :cursor)
            ORDER BY c.commentId ASC
            """)
    List<Comment> findByPostIdWithCursor(
            @Param("postId") Long postId,
            @Param("cursor") Long cursor,
            org.springframework.data.domain.Pageable pageable);
}
