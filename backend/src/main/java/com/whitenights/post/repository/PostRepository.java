package com.whitenights.post.repository;

import com.whitenights.post.domain.Post;
import com.whitenights.auth.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
    long countByUser(User user);
}
