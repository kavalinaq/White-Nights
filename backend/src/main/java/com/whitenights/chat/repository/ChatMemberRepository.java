package com.whitenights.chat.repository;

import com.whitenights.chat.domain.ChatMember;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMemberRepository extends JpaRepository<ChatMember, ChatMember.ChatMemberId> {

    List<ChatMember> findByIdChatId(Long chatId);

  @Query("""
      SELECT m FROM ChatMember m
      JOIN FETCH m.user
      WHERE m.id.chatId IN :chatIds
      """)
  List<ChatMember> findByChatIdInFetchUser(@Param("chatIds") Collection<Long> chatIds);

  boolean existsByIdChatIdAndIdUserId(Long chatId, Long userId);

    void deleteByIdChatId(Long chatId);
}
