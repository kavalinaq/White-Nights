package com.whitenights.post.repository;

import com.whitenights.post.domain.Save;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface SaveRepository extends JpaRepository<Save, Save.UserPostId> {

    @Query("SELECT s.id.postId FROM Save s WHERE s.id.userId = :userId AND s.id.postId IN :postIds")
    Set<Long> findSavedPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);

    @Query("""
            SELECT s FROM Save s
            JOIN FETCH s.post p
            WHERE s.id.userId = :userId
              AND p.isBlocked = false
              AND (:cursor IS NULL OR s.id.postId < :cursor)
            ORDER BY s.id.postId DESC
            """)
    List<Save> findByUserIdWithCursor(
            @Param("userId") Long userId,
            @Param("cursor") Long cursor,
            org.springframework.data.domain.Pageable pageable);
}
