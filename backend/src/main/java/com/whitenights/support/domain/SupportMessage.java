package com.whitenights.support.domain;

import com.whitenights.auth.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "support_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMessage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long supportMessageId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(nullable = false, length = 200)
  private String subject;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Column(columnDefinition = "TEXT")
  private String response;

  @Column(name = "responded_at")
  private LocalDateTime respondedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "responded_by")
  private User respondedBy;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  @Builder.Default
  private SupportStatus status = SupportStatus.open;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
