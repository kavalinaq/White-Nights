package com.whitenights.support.repository;

import com.whitenights.support.domain.SupportMessage;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

  List<SupportMessage> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

  List<SupportMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
