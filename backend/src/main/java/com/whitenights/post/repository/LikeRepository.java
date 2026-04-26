package com.whitenights.post.repository;

import com.whitenights.post.domain.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Set;

public interface LikeRepository extends JpaRepository<Like, Like.UserPostId> {

    @Query("SELECT l.id.postId FROM Like l WHERE l.id.userId = :userId AND l.id.postId IN :postIds")
    Set<Long> findLikedPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);
}
