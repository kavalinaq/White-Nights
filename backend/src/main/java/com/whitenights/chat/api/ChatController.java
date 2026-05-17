package com.whitenights.chat.api;

import com.whitenights.auth.domain.User;
import com.whitenights.chat.api.dto.AddMemberRequest;
import com.whitenights.chat.api.dto.ChatMemberResponse;
import com.whitenights.chat.api.dto.ChatResponse;
import com.whitenights.chat.api.dto.CreateChatRequest;
import com.whitenights.chat.api.dto.MessageResponse;
import com.whitenights.chat.service.ChatService;
import com.whitenights.common.security.CurrentUserResolver;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
  private final CurrentUserResolver currentUserResolver;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/api/chats")
    public List<ChatResponse> getChats(@AuthenticationPrincipal String email) {
      return chatService.getChats(currentUserResolver.resolve(email));
    }

    @PostMapping("/api/chats")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatResponse createChat(
            @RequestBody CreateChatRequest request,
            @AuthenticationPrincipal String email) {
      return chatService.createChat(request.peerId(), request.name(), request.memberIds(), currentUserResolver.resolve(email));
    }

    @DeleteMapping("/api/chats/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteChat(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
      chatService.deleteChat(id, currentUserResolver.resolve(email));
    }

    @GetMapping("/api/chats/{id}/messages")
    public List<MessageResponse> getMessages(
            @PathVariable Long id,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "50") int limit,
            @AuthenticationPrincipal String email) {
      return chatService.getMessages(id, cursor, limit, currentUserResolver.resolve(email));
    }

  @GetMapping("/api/chats/{id}/members")
  public List<ChatMemberResponse> getMembers(
      @PathVariable Long id,
      @AuthenticationPrincipal String email) {
    return chatService.getMembers(id, currentUserResolver.resolve(email));
  }

  @PostMapping("/api/chats/{id}/avatar")
  public ChatResponse updateAvatar(
      @PathVariable Long id,
      @RequestParam("file") MultipartFile file,
      @AuthenticationPrincipal String email) {
    return chatService.updateAvatar(id, file, currentUserResolver.resolve(email));
    }

    @PostMapping("/api/chats/{id}/members")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addMember(
            @PathVariable Long id,
            @RequestBody @Valid AddMemberRequest request,
            @AuthenticationPrincipal String email) {
      chatService.addMember(id, request.userId(), currentUserResolver.resolve(email));
    }

    @DeleteMapping("/api/chats/{id}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal String email) {
      chatService.removeMember(id, userId, currentUserResolver.resolve(email));
    }

    @PostMapping("/api/chats/{id}/upload-image")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal String email) {
      User user = currentUserResolver.resolve(email);
        MessageResponse response = chatService.saveImageMessage(id, file, user);
        messagingTemplate.convertAndSend("/topic/chat/" + id, response);
        return response;
    }

    @DeleteMapping("/api/messages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMessage(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
      MessageResponse updated = chatService.deleteMessage(id, currentUserResolver.resolve(email));
        messagingTemplate.convertAndSend("/topic/chat/" + updated.chatId(), updated);
    }

}
