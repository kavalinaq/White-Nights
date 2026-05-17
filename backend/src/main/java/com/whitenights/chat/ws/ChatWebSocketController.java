package com.whitenights.chat.ws;

import com.whitenights.auth.domain.User;
import com.whitenights.chat.api.dto.MessageResponse;
import com.whitenights.chat.service.ChatService;
import com.whitenights.common.security.CurrentUserResolver;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
  private final CurrentUserResolver currentUserResolver;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{chatId}")
    public void sendMessage(
            @DestinationVariable Long chatId,
            @Payload String text,
            Principal principal) {
      User sender = currentUserResolver.resolve(principal.getName());
        MessageResponse response = chatService.saveAndBuildResponse(chatId, text, sender);
        messagingTemplate.convertAndSend("/topic/chat/" + chatId, response);
    }
}
