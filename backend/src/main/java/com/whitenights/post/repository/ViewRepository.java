package com.whitenights.post.repository;

import com.whitenights.post.domain.View;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ViewRepository extends JpaRepository<View, View.UserPostId> {}
