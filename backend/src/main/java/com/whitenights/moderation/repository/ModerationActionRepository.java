package com.whitenights.moderation.repository;

import com.whitenights.moderation.domain.ModerationAction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModerationActionRepository extends JpaRepository<ModerationAction, Long> {}
