package com.whitenights.support.service;

import com.whitenights.auth.domain.User;
import com.whitenights.common.exception.types.NotFoundException;
import com.whitenights.support.api.dto.SupportMessageResponse;
import com.whitenights.support.domain.SupportMessage;
import com.whitenights.support.domain.SupportStatus;
import com.whitenights.support.repository.SupportMessageRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupportService {

  private final SupportMessageRepository repository;

  @Transactional
  public SupportMessageResponse submit(User user, String subject, String message) {
    SupportMessage saved = repository.save(SupportMessage.builder()
        .user(user)
        .subject(subject)
        .message(message)
        .status(SupportStatus.open)
        .build());
    return toResponse(saved);
  }

  public List<SupportMessageResponse> myMessages(User user) {
    return repository.findByUser_UserIdOrderByCreatedAtDesc(user.getUserId())
        .stream().map(this::toResponse).toList();
  }

  @PreAuthorize("hasRole('ADMIN')")
  public List<SupportMessageResponse> listAll(User admin, int limit) {
    return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(limit, 100)))
        .stream().map(this::toResponse).toList();
  }

  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public SupportMessageResponse reply(Long id, String response, User admin) {
    SupportMessage msg = repository.findById(id)
        .orElseThrow(() -> new NotFoundException("Support message not found"));
    msg.setResponse(response);
    msg.setRespondedAt(LocalDateTime.now());
    msg.setRespondedBy(admin);
    msg.setStatus(SupportStatus.resolved);
    return toResponse(repository.save(msg));
  }

  private SupportMessageResponse toResponse(SupportMessage m) {
    return new SupportMessageResponse(
        m.getSupportMessageId(),
        m.getUser() != null ? m.getUser().getUserId() : null,
        m.getUser() != null ? m.getUser().getNickname() : null,
        m.getSubject(),
        m.getMessage(),
        m.getResponse(),
        m.getRespondedAt(),
        m.getRespondedBy() != null ? m.getRespondedBy().getNickname() : null,
        m.getStatus(),
        m.getCreatedAt()
    );
  }
}
