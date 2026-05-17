package com.whitenights.chat.repository;

import com.whitenights.chat.domain.Message;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {

    void deleteByChatChatId(Long chatId);

    @Query("""
            SELECT m FROM Message m
            WHERE m.chat.chatId = :chatId
              AND (:cursor IS NULL OR m.messageId < :cursor)
            ORDER BY m.messageId DESC
            """)
    List<Message> findByChatWithCursor(
            @Param("chatId") Long chatId,
            @Param("cursor") Long cursor,
            Pageable pageable);

    @Query("""
            SELECT m FROM Message m
            WHERE m.chat.chatId = :chatId
            ORDER BY m.messageId DESC
            """)
    List<Message> findLatestMessage(@Param("chatId") Long chatId, Pageable pageable);

  @Query("""
      SELECT m FROM Message m
      JOIN FETCH m.chat
      LEFT JOIN FETCH m.sender
      WHERE m.messageId IN (
          SELECT MAX(m2.messageId) FROM Message m2
          WHERE m2.chat.chatId IN :chatIds
          GROUP BY m2.chat.chatId
      )
      """)
  List<Message> findLatestMessagesByChatIdIn(@Param("chatIds") Collection<Long> chatIds);
}
